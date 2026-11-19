from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    AI_SERVICE_PORT: int = 8000
    AI_SERVICE_HOST: str = "0.0.0.0"
    MIN_TRAINING_ROWS: int = 10
    FORECAST_HORIZON_DAYS: int = 7

    class Config:
        env_file = ".env"


settings = Settings()
