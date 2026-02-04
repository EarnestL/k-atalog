"""Auth endpoints – Supabase JWT verification."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user_optional
from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_current_user_info(
    user: dict | None = Depends(get_current_user_optional),
) -> dict:
    """
    Return current user info if authenticated. 401 if not.
    Client can use this to confirm session or get user id/email for API calls.
    """
    if user is None:
        if not get_settings().supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth not configured (SUPABASE_JWT_SECRET not set)",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "user": {
            "id": user.get("sub"),
            "email": user.get("email"),
            "role": user.get("role"),
        },
    }
