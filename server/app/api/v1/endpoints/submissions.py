"""Submissions API – user photocard submission history."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.db import is_connected
from app.schemas.submission import SubmissionSchema
from app.services.data_loader import get_submissions_by_email_async

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.get("", response_model=list[SubmissionSchema])
async def list_my_submissions(
    user: dict = Depends(get_current_user),
) -> list[SubmissionSchema]:
    """List the current user's submissions (newest first). Requires auth and MongoDB."""
    if not is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Submissions require MongoDB (MONGODB_URI not configured)",
        )
    user_email = user.get("email") or ""
    if not user_email:
        return []
    return await get_submissions_by_email_async(user_email, limit=50)
