from pydantic_settings import BaseSettings
from pydantic import model_validator
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

    @model_validator(mode="after")
    def require_production_secret(self):
        if self.app_env.lower() in {"production", "prod"} and (
            len(self.secret_key.strip()) < 32
            or self.secret_key in {
                "change-this-secret-key",
                "your-very-secret-key-change-this-in-production",
            }
        ):
            raise ValueError("Set SECRET_KEY to a unique value of at least 32 characters before production startup.")
        return self


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings so the .env file is read only once."""
    return Settings()
