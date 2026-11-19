"""
main.py — FastAPI application entry point.

Startup sequence:
  1. Connect to DB.
  2. Discover all restaurants in the DB and pre-train models for each.
  3. Mount routers.
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from routers import forecast, health
from trainer import train_restaurant

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train models for all existing restaurants on startup."""
    db = SessionLocal()
    try:
        from sqlalchemy import text
        rows = db.execute(text('SELECT id FROM "Restaurant"')).fetchall()
        restaurant_ids = [r.id for r in rows]
        logger.info(f"[startup] Found {len(restaurant_ids)} restaurant(s) — starting pre-training…")
        for rid in restaurant_ids:
            try:
                train_restaurant(rid, db)
            except Exception as exc:
                logger.error(f"[startup] Training failed for {rid}: {exc}")
    except Exception as exc:
        logger.error(f"[startup] Could not query restaurants: {exc}")
    finally:
        db.close()

    logger.info("[startup] AI service ready.")
    yield
    logger.info("[shutdown] AI service stopping.")


app = FastAPI(
    title="Restaurant AI Microservice",
    description="Demand forecasting and food waste prevention using XGBoost.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["forecast"])


if __name__ == "__main__":
    import uvicorn
    from config import settings
    uvicorn.run("main:app", host=settings.AI_SERVICE_HOST, port=settings.AI_SERVICE_PORT, reload=True)
