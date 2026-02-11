"""
Supabase Auth – verify JWT tokens issued by Supabase.

Supports both legacy HS256 (JWT secret) and new signing keys (ES256/RS256 via JWKS).
"""

from typing import Any

import jwt
from jwt import InvalidSignatureError
from jwt import PyJWKClient

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Cached JWKS client (one per process)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient | None:
    global _jwks_client
    url = get_settings().supabase_jwks_url
    if not url:
        return None
    if _jwks_client is None:
        _jwks_client = PyJWKClient(url, cache_jwk_set=True, lifespan=600)
    return _jwks_client


def _verify_with_jwks(token: str) -> dict[str, Any] | None:
    """Verify token using JWKS (ES256/RS256)."""
    client = _get_jwks_client()
    if not client:
        return None
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        # Supabase uses ES256 for new signing keys
        algorithms = ["ES256", "RS256"]
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=algorithms,
            audience=get_settings().supabase_jwt_audience,
            options={"verify_exp": True, "verify_aud": True},
        )
        return payload
    except Exception as e:
        logger.debug("JWKS verification failed: %s", e)
        return None


def _verify_with_secret(token: str) -> dict[str, Any] | None:
    """Verify token using legacy JWT secret (HS256)."""
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        return None
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
            options={"verify_exp": True, "verify_aud": True},
        )
    except Exception:
        return None


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    """
    Decode and verify a Supabase JWT. Returns the payload on success, None on failure.

    Tries JWKS (ES256/RS256) first, then legacy secret (HS256).
    """
    settings = get_settings()
    if not settings.supabase_jwks_url and not settings.supabase_jwt_secret:
        logger.warning(
            "Auth not configured: set SUPABASE_URL (for JWKS) or SUPABASE_JWT_SECRET (legacy)"
        )
        return None

    # Peek at header to choose verification path
    try:
        unverified = jwt.get_unverified_header(token)
        alg = unverified.get("alg", "")
    except Exception as e:
        logger.warning("Supabase JWT invalid: %s", e)
        return None

    # ES256/RS256: use JWKS
    if alg in ("ES256", "RS256"):
        if settings.supabase_jwks_url:
            result = _verify_with_jwks(token)
            if result is not None:
                return result
            logger.warning("JWKS verification failed for %s token", alg)
        else:
            logger.warning(
                "Token uses %s but SUPABASE_URL not set. "
                "Add SUPABASE_URL (same as client VITE_SUPABASE_URL) to server/.env",
                alg,
            )
        return None

    # HS256: use legacy secret
    if alg == "HS256":
        result = _verify_with_secret(token)
        if result is not None:
            return result
        logger.warning("Legacy HS256 verification failed")
        return None

    logger.warning("Unsupported JWT algorithm: %s", alg)
    return None
