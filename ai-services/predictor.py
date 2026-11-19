"""
predictor.py — loads a saved model and produces a demand forecast.

For each forecasted menu item:
  1. Load the .joblib artefact for (restaurantId, menuItemId).
  2. Reconstruct the historical daily series.
  3. Build future feature rows using features.build_future_features.
  4. Return predicted quantities per future date.
"""
import logging
from datetime import date
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from config import settings
from features import FEATURE_COLS, build_future_features

logger = logging.getLogger("predictor")

MODELS_DIR = Path("models")


def _model_path(restaurant_id: str, menu_item_id: str) -> Path:
    return MODELS_DIR / restaurant_id / f"{menu_item_id}.joblib"


def predict_item(
    restaurant_id: str,
    menu_item_id: str,
    horizon: int = None,
) -> Optional[list[dict]]:
    """
    Loads the trained model for a menu item and returns a list of predictions:
    [{"date": "2026-07-03", "predictedQuantity": 12.5, "confidence": 0.85}, ...]

    Returns None if no model exists (not enough training data).
    """
    if horizon is None:
        horizon = settings.FORECAST_HORIZON_DAYS

    path = _model_path(restaurant_id, menu_item_id)
    if not path.exists():
        logger.info(f"[predict] No model found at {path}")
        return None

    artefact = joblib.load(path)
    model = artefact["model"]
    daily: pd.DataFrame = artefact["daily"]

    # Build history as a dict[date -> quantity] for the feature builder
    history_series = pd.Series(
        daily["target"].values,
        index=pd.to_datetime(daily["date"]),
    )

    last_date = daily["date"].max()
    future_df = build_future_features(last_date, horizon, history_series)

    X_pred = future_df[FEATURE_COLS].values
    raw_preds = model.predict(X_pred)

    # Clamp negatives (demand can't be negative)
    preds = np.clip(raw_preds, 0, None)

    # Naive confidence: scale inversely by coefficient of variation of training targets
    cv = daily["target"].std() / (daily["target"].mean() + 1e-6)
    confidence = float(np.clip(1 - cv, 0.5, 0.99))

    results = []
    for i, row in future_df.iterrows():
        results.append(
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "predictedQuantity": round(float(preds[i]), 2),
                "confidence": round(confidence, 4),
            }
        )

    return results


def predict_restaurant(
    restaurant_id: str,
    menu_item_ids: list[str],
    horizon: int = None,
) -> list[dict]:
    """
    Run predictions for multiple menu items.
    Skips items with no saved model.
    """
    if horizon is None:
        horizon = settings.FORECAST_HORIZON_DAYS

    results = []
    for menu_item_id in menu_item_ids:
        preds = predict_item(restaurant_id, menu_item_id, horizon)
        if preds:
            results.append(
                {
                    "menuItemId": menu_item_id,
                    "predictions": preds,
                }
            )
    return results
