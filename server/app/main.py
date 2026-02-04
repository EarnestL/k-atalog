"""FastAPI application factory and lifecycle."""

import asyncio
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.db import close_mongodb, connect_mongodb
from app.core.logging_config import setup_logging, get_logger
from app.services.data_loader import load_data, seed_mongodb_if_empty

logger = get_logger(__name__)

# Max time to wait for MongoDB connect + seed when MongoDB is required
STARTUP_MONGODB_TIMEOUT_SECONDS = 20


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security-related HTTP headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


async def _startup_mongodb_or_fallback() -> None:
    """When MongoDB is configured: connect and seed (required; no file fallback). Otherwise load file data."""
    settings = get_settings()
    if not settings.mongodb_configured:
        logger.info("MongoDB not configured (using file/hardcoded data)")
        load_data()
        return

    async def _connect_and_seed() -> None:
        await connect_mongodb()
        logger.info("MongoDB connected")
        try:
            await seed_mongodb_if_empty()
        except Exception as e:
            logger.warning("MongoDB seed failed: %s", e)

    try:
        await asyncio.wait_for(_connect_and_seed(), timeout=STARTUP_MONGODB_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error(
            "MongoDB connection timed out after %s s. "
            "Check: 1) Atlas cluster is running, 2) Your IP is in Atlas Network Access (or use 0.0.0.0/0 for dev), "
            "3) MONGODB_URI is correct, 4) No firewall/VPN blocking outbound connections.",
            STARTUP_MONGODB_TIMEOUT_SECONDS,
        )
        raise
    except Exception:
        # db.connect_mongodb() already logged the error and re-raised; propagate so server fails to start
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: MongoDB when configured (required), else file data. Shutdown: cleanup."""
    setup_logging()
    logger.info("Starting %s", get_settings().app_name)
    await _startup_mongodb_or_fallback()
    yield
    await close_mongodb()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    # In production, disable interactive docs unless DEBUG is true (reduce attack surface)
    docs_enabled = settings.debug or settings.environment != "production"
    app = FastAPI(
        title=settings.app_name,
        description="API for the Katalog photocard catalog application.",
        version="1.0.0",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        lifespan=lifespan,
    )

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/")
    def root() -> dict:
        out: dict = {"message": "Katalog API", "api": settings.api_v1_prefix}
        if docs_enabled:
            out["docs"] = "/docs"
        return out

    return app


app = create_app()
