from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/careerforge"

    # JWT
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # App
    app_env: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings so the .env file is read only once."""
    return Settings()
