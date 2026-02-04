"""
Supabase Auth – verify JWT tokens issued by Supabase.

The client obtains tokens from Supabase (signUp/signIn); the backend verifies
them locally using the Supabase JWT secret. No outbound calls to Supabase.
"""

from typing import Any

import jwt

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    """
    Decode and verify a Supabase JWT. Returns the payload on success, None on failure.

    Payload includes: sub (user id), email, role, aud, exp, etc.
    """
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        logger.warning("SUPABASE_JWT_SECRET not set; auth verification disabled")
        return None
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
            options={"verify_exp": True, "verify_aud": True},
        )
        return payload
    except jwt.DecodeError:
        logger.debug("Supabase JWT decode failed: invalid token")
        return None
    except jwt.ExpiredSignatureError:
        logger.debug("Supabase JWT expired")
        return None
    except jwt.InvalidAudienceError:
        logger.debug("Supabase JWT invalid audience")
        return None
    except Exception as e:
        logger.debug("Supabase JWT verification failed: %s", e)
        return None
