"""FastAPI application factory and lifecycle."""

import asyncio
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

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

# Rate limit: 100 requests per minute per client IP
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW_SEC = 60
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def _get_client_ip(request: Request) -> str:
    """Get client IP, considering X-Forwarded-For when behind a proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limit_exceeded(ip: str) -> bool:
    """Check if IP has exceeded rate limit. Uses sliding window."""
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW_SEC
    timestamps = _rate_limit_store[ip]
    _rate_limit_store[ip] = [t for t in timestamps if t > window_start]
    if len(_rate_limit_store[ip]) >= RATE_LIMIT_REQUESTS:
        return True
    _rate_limit_store[ip].append(now)
    return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting per client IP."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)
        ip = _get_client_ip(request)
        if _rate_limit_exceeded(ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(RATE_LIMIT_WINDOW_SEC)},
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security-related HTTP headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' https: data:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
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
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
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
