"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic import Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Default secret is insecure; production must set a strong SECRET_KEY in .env
INSECURE_SECRET_PLACEHOLDER = "change-me-in-production-use-openssl-rand-hex-32"

_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _parse_origins(s: str) -> List[str]:
    parsed = [x.strip() for x in s.split(",") if x.strip()]
    return parsed if parsed else ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings(BaseSettings):
    """Application settings loaded from environment and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Katalog API"
    debug: bool = False
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # API
    api_v1_prefix: str = "/api/v1"
    # Store as str so .env is never JSON-parsed; allowed_origins (list) is computed below
    allowed_origins_raw: str = Field(default=_DEFAULT_ORIGINS, alias="allowed_origins")

    @computed_field
    @property
    def allowed_origins(self) -> List[str]:
        return _parse_origins(self.allowed_origins_raw)

    # MongoDB – store in .env only; never commit .env or log this value
    # Leave empty to use file/hardcoded data instead of MongoDB
    mongodb_uri: str = ""
    mongodb_database_name: str = "katalog"

    # Optional: future auth (must be overridden in production)
    secret_key: str = INSECURE_SECRET_PLACEHOLDER
    access_token_expire_minutes: int = 30

    @model_validator(mode="after")
    def require_strong_secret_in_production(self) -> "Settings":
        """In production, SECRET_KEY must not be the default placeholder."""
        if self.environment == "production" and self.secret_key == INSECURE_SECRET_PLACEHOLDER:
            raise ValueError(
                "SECRET_KEY must be set to a strong random value in production. "
                "Generate one with: openssl rand -hex 32"
            )
        return self

    @property
    def mongodb_configured(self) -> bool:
        """True if a MongoDB URI is set (and thus DB should be used)."""
        return bool(self.mongodb_uri.strip())


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
