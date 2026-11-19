"""
trainer.py — XGBoost training pipeline.

For each restaurant:
  1. Pull all non-cancelled order items from the DB.
  2. For each menu item with enough data, build features via features.py.
  3. Train an XGBoost regressor per menu item.
  4. Persist model artefacts to disk under models/<restaurantId>/<menuItemId>.joblib

The trainer is run:
  - On microservice startup (for every restaurant in the DB).
  - Via the POST /api/v1/forecast/train endpoint triggered by the Node.js server.
"""
import os
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from xgboost import XGBRegressor

from config import settings
from features import FEATURE_COLS, build_daily_series

logger = logging.getLogger("trainer")

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)


def _model_path(restaurant_id: str, menu_item_id: str) -> Path:
    d = MODELS_DIR / restaurant_id
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{menu_item_id}.joblib"


def train_restaurant(restaurant_id: str, db: Session) -> dict:
    """
    Train demand forecasting models for every menu item in the restaurant.
    Returns a summary dict: {trained: int, skipped: int, errors: int}
    """
    logger.info(f"[train] Starting training for restaurant {restaurant_id}")

    # --- Pull raw data via raw SQL to avoid ORM overhead ---
    query = """
        SELECT
            oi."menuItemId",
            mi."name"        AS "menuItemName",
            oi."quantity",
            o."createdAt"    AS "orderDate"
        FROM "OrderItem" oi
        JOIN "Order"     o  ON o.id = oi."orderId"
        JOIN "MenuItem"  mi ON mi.id = oi."menuItemId"
        WHERE oi."restaurantId" = :rid
          AND o."status" != 'CANCELLED'
        ORDER BY o."createdAt"
    """
    from sqlalchemy import text
    rows = db.execute(text(query), {"rid": restaurant_id}).fetchall()

    if not rows:
        logger.warning(f"[train] No order data found for {restaurant_id}")
        return {"trained": 0, "skipped": 0, "errors": 0}

    df = pd.DataFrame(rows, columns=["menuItemId", "menuItemName", "quantity", "orderDate"])
    df["orderDate"] = pd.to_datetime(df["orderDate"])

    trained = 0
    skipped = 0
    errors = 0

    for menu_item_id in df["menuItemId"].unique():
        try:
            daily = build_daily_series(df, menu_item_id)

            if len(daily) < settings.MIN_TRAINING_ROWS:
                logger.info(
                    f"[train] Skipping {menu_item_id} — only {len(daily)} days of data "
                    f"(need {settings.MIN_TRAINING_ROWS})"
                )
                skipped += 1
                continue

            X = daily[FEATURE_COLS].values
            y = daily["target"].values

            model = XGBRegressor(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.08,
                subsample=0.8,
                colsample_bytree=0.8,
                objective="reg:squarederror",
                random_state=42,
                n_jobs=-1,
                verbosity=0,
            )
            model.fit(X, y)

            path = _model_path(restaurant_id, menu_item_id)
            joblib.dump({"model": model, "daily": daily}, path)
            logger.info(f"[train] Saved model to {path}")
            trained += 1

        except Exception as exc:
            logger.error(f"[train] Error training {menu_item_id}: {exc}")
            errors += 1

    result = {"trained": trained, "skipped": skipped, "errors": errors}
    logger.info(f"[train] Done for {restaurant_id}: {result}")
    return result
