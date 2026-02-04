"""Health and readiness endpoints."""

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    """Liveness: is the process up."""
    return {"status": "ok", "service": get_settings().app_name}


@router.get("/ready")
def readiness_check() -> dict:
    """Readiness: can the app serve traffic (e.g. DB connected)."""
    # Extend later: check DB, cache, etc.
    return {"status": "ready"}
