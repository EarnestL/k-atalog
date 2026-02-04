"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import List, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Default secret is insecure; production must set a strong SECRET_KEY in .env
INSECURE_SECRET_PLACEHOLDER = "change-me-in-production-use-openssl-rand-hex-32"


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
    allowed_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS from .env into a list. Never return empty."""
        default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
        if isinstance(v, str):
            parsed = [x.strip() for x in v.split(",") if x.strip()]
            return parsed if parsed else default_origins
        if isinstance(v, list):
            return v if v else default_origins
        return default_origins

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
