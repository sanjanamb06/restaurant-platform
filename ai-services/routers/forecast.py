"""
FastAPI router for forecast endpoints.
All routes are prefixed with /api/v1/forecast (mounted in main.py).
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from predictor import predict_restaurant
from trainer import train_restaurant

logger = logging.getLogger("forecast_router")
router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic Response Schemas
# ---------------------------------------------------------------------------


class DayPrediction(BaseModel):
    date: str
    predictedQuantity: float
    confidence: float


class ItemForecast(BaseModel):
    menuItemId: str
    menuItemName: Optional[str] = None
    predictions: list[DayPrediction]


class ForecastResponse(BaseModel):
    restaurantId: str
    horizon: int
    forecasts: list[ItemForecast]


class TrainResponse(BaseModel):
    restaurantId: str
    trained: int
    skipped: int
    errors: int
    message: str


# ---------------------------------------------------------------------------
# GET /forecast
# ---------------------------------------------------------------------------


@router.get("", response_model=ForecastResponse)
def get_forecast(
    restaurantId: str = Query(..., description="Restaurant CUID"),
    horizon: int = Query(7, ge=1, le=30, description="Days to forecast"),
    db: Session = Depends(get_db),
):
    """
    Returns demand forecast for all menu items of the given restaurant.
    Only returns items for which a trained model exists.
    """
    # Fetch all active menu item ids + names for the restaurant
    rows = db.execute(
        text(
            'SELECT id, name FROM "MenuItem" WHERE "restaurantId" = :rid AND "deletedAt" IS NULL'
        ),
        {"rid": restaurantId},
    ).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Restaurant not found or no menu items.")

    menu_items = {r.id: r.name for r in rows}
    menu_item_ids = list(menu_items.keys())

    raw_forecasts = predict_restaurant(restaurantId, menu_item_ids, horizon)

    # Enrich with item names
    enriched = []
    for fc in raw_forecasts:
        enriched.append(
            ItemForecast(
                menuItemId=fc["menuItemId"],
                menuItemName=menu_items.get(fc["menuItemId"]),
                predictions=[DayPrediction(**p) for p in fc["predictions"]],
            )
        )

    return ForecastResponse(
        restaurantId=restaurantId,
        horizon=horizon,
        forecasts=enriched,
    )


# ---------------------------------------------------------------------------
# POST /forecast/train
# ---------------------------------------------------------------------------


@router.post("/train", response_model=TrainResponse)
def trigger_training(
    restaurantId: str = Query(..., description="Restaurant CUID"),
    db: Session = Depends(get_db),
):
    """
    Triggers (re-)training of demand forecasting models for the given restaurant.
    Called by the Node.js backend after a restaurant has enough data.
    """
    try:
        result = train_restaurant(restaurantId, db)
        return TrainResponse(
            restaurantId=restaurantId,
            trained=result["trained"],
            skipped=result["skipped"],
            errors=result["errors"],
            message=(
                f"Training complete. {result['trained']} model(s) trained, "
                f"{result['skipped']} skipped (insufficient data), "
                f"{result['errors']} error(s)."
            ),
        )
    except Exception as exc:
        logger.error(f"Training failed for {restaurantId}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
