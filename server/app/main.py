"""FastAPI application factory and lifecycle."""

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security-related HTTP headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: optional MongoDB + seed if empty, else in-memory data. Shutdown: cleanup."""
    setup_logging()
    logger.info("Starting %s", get_settings().app_name)
    settings = get_settings()
    if settings.mongodb_configured:
        if await connect_mongodb():
            logger.info("MongoDB connected")
            try:
                await seed_mongodb_if_empty()
            except Exception as e:
                logger.warning("MongoDB seed failed: %s", e)
        else:
            logger.warning("MongoDB connection failed; check MONGODB_URI and network")
            try:
                load_data()
            except Exception as e:
                logger.warning("Data not loaded: %s. Some endpoints may fail.", e)
    else:
        logger.info("MongoDB not configured (using file/hardcoded data)")
        try:
            load_data()
        except Exception as e:
            logger.warning("Data not loaded: %s. Some endpoints may fail.", e)
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
        return {"message": "Katalog API", "docs": "/docs", "api": settings.api_v1_prefix}

    return app


app = create_app()
