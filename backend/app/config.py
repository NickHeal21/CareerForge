from functools import lru_cache
from ipaddress import ip_address
from pathlib import Path
import re
from urllib.parse import urlsplit

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


SUPPORTED_APP_ENVS = {"development", "production", "prod"}
PLACEHOLDER_SECRETS = {
    "change-this-secret-key",
    "your-very-secret-key-change-this-in-production",
}


def api_documentation_options(app_env: str) -> dict[str, str | None]:
    """Keep interactive API documentation available locally, but private in production."""
    if app_env == "production":
        return {"docs_url": None, "redoc_url": None, "openapi_url": None}
    return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}


def _is_weak_production_secret(secret: str) -> bool:
    value = secret.strip()
    lowered = value.lower()
    if len(value) < 32 or value != secret or lowered in PLACEHOLDER_SECRETS:
        return True
    weak_fragments = (
        "replace-me", "replace_with", "placeholder", "your-secret", "change-me",
        "password", "qwerty", "letmein", "changeme", "abcdef", "12345678",
        "01234567", "careerforge", "example",
    )
    if any(marker in lowered for marker in weak_fragments):
        return True
    if len(set(value)) < 12:
        return True
    # Reject long strings made by repeating a short, obvious pattern.
    for size in range(1, min(32, len(value) // 2) + 1):
        if len(value) % size == 0 and value == value[:size] * (len(value) // size):
            return True
    return False


def _canonical_https_origin(origin: str) -> str:
    """Validate one unambiguous HTTPS origin and return its browser-canonical form."""
    if not origin or origin != origin.strip() or any(char.isspace() for char in origin):
        raise ValueError("Production CORS origins must be valid exact HTTPS origins.")
    try:
        parsed = urlsplit(origin)
        hostname = parsed.hostname
        port = parsed.port  # Accessing this validates numeric syntax and the valid port range.
    except ValueError as exc:
        raise ValueError("Production CORS origins must be valid exact HTTPS origins.") from exc

    if (
        parsed.scheme.lower() != "https"
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path
        or parsed.query
        or parsed.fragment
        or "?" in origin
        or "#" in origin
        or "%" in parsed.netloc
        or "*" in parsed.netloc
        or parsed.netloc.endswith(":")
    ):
        raise ValueError("Production CORS origins must be valid exact HTTPS origins.")

    host = hostname.lower()
    try:
        address = ip_address(host)
    except ValueError:
        # Validate DNS/IDN host labels without accepting underscores, empty labels,
        # trailing dots, or other URL-parser-tolerated ambiguous host forms.
        if host.endswith(".") or len(host) > 253:
            raise ValueError("Production CORS origins must contain a valid hostname.")
        try:
            ascii_host = host.encode("idna").decode("ascii")
        except UnicodeError as exc:
            raise ValueError("Production CORS origins must contain a valid hostname.") from exc
        labels = ascii_host.split(".")
        label_pattern = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
        if len(labels) < 2 or any(not label_pattern.fullmatch(label) for label in labels):
            raise ValueError("Production CORS origins must contain a valid hostname.")
        if host == "localhost" or host.endswith(".localhost"):
            raise ValueError("Production CORS origins must not use localhost or loopback hosts.")
        rendered_host = ascii_host
    else:
        mapped_address = address.ipv4_mapped if address.version == 6 else None
        if (
            address.is_loopback
            or address.is_unspecified
            or (mapped_address is not None and (mapped_address.is_loopback or mapped_address.is_unspecified))
        ):
            raise ValueError("Production CORS origins must not use localhost or loopback hosts.")
        rendered_host = f"[{host}]" if address.version == 6 else host

    # Browsers omit the default HTTPS port from the serialized Origin header.
    canonical_port = "" if port in (None, 443) else f":{port}"
    return f"https://{rendered_host}{canonical_port}"


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

    # External job search (RapidAPI JSearch)
    jsearch_api_key: str = ""

    # App
    app_env: str = "development"
    # Comma-separated browser origins. Local development remains the default.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        # Resolve backend/.env independently of the process working directory.
        env_file = str(Path(__file__).resolve().parents[1] / ".env")
        extra = "ignore"

    @field_validator("app_env", mode="before")
    @classmethod
    def validate_app_env(cls, value):
        if not isinstance(value, str):
            raise ValueError("APP_ENV must be development, production, or prod.")
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_APP_ENVS:
            raise ValueError("APP_ENV must be development, production, or prod.")
        return "production" if normalized == "prod" else normalized

    @property
    def cors_origin_list(self) -> list[str]:
        """Return validated production origins or configured local origins."""
        values = self.cors_origins.split(",")
        if self.app_env == "production":
            if not values or any(not value.strip() for value in values):
                raise ValueError("Set CORS_ORIGINS to exact HTTPS frontend origins.")
            normalized = [_canonical_https_origin(value.strip()) for value in values]
            if len(set(normalized)) != len(normalized):
                raise ValueError("CORS_ORIGINS must not contain duplicate or ambiguous origins.")
            return normalized
        return [origin.strip().rstrip("/") for origin in values if origin.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.app_env != "production":
            return self

        if _is_weak_production_secret(self.secret_key):
            raise ValueError(
                "Set SECRET_KEY to a unique, securely generated random value of at least 32 characters."
            )

        # Evaluate production origins during settings initialization so invalid values
        # cannot be deferred until middleware construction.
        self.cors_origin_list

        try:
            database = urlsplit(self.database_url)
            database_host = database.hostname
        except ValueError as exc:
            raise ValueError("Set DATABASE_URL to a dedicated non-local PostgreSQL database.") from exc
        if (
            database.scheme not in {"postgresql", "postgresql+psycopg2"}
            or not database_host
            or database_host.lower() in {"localhost", "127.0.0.1", "0.0.0.0", "::", "::1"}
            or database_host.lower().endswith(".localhost")
        ):
            raise ValueError("Set DATABASE_URL to a dedicated non-local PostgreSQL database.")
        return self


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings so the .env file is read only once."""
    return Settings()
