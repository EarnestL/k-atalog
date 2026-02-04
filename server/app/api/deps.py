"""FastAPI dependency injection."""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.supabase_auth import verify_supabase_token
from app.schemas.group import GroupSchema
from app.schemas.member import MemberSchema
from app.services.data_loader import (
    get_group_by_id_async,
    get_member_by_id_async,
)

# Limit path param length to reduce abuse (e.g. very long strings in URLs)
PATH_PARAM_MAX_LENGTH = 200


def _validate_path_param(value: str, name: str) -> None:
    if len(value) > PATH_PARAM_MAX_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be at most {PATH_PARAM_MAX_LENGTH} characters",
        )


async def get_group_or_404(group_id: str) -> GroupSchema:
    """Dependency: resolve group by id or raise 404."""
    _validate_path_param(group_id, "group_id")
    group = await get_group_by_id_async(group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group not found: {group_id}",
        )
    return group


async def get_member_or_404(group_id: str, member_id: str) -> MemberSchema:
    """Dependency: resolve member by group_id and member_id or raise 404."""
    _validate_path_param(group_id, "group_id")
    _validate_path_param(member_id, "member_id")
    member = await get_member_by_id_async(group_id, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member not found: {group_id}/{member_id}",
        )
    return member


# Type aliases for use in route signatures
GroupDep = Annotated[GroupSchema, Depends(get_group_or_404)]


# ---- Auth (Supabase JWT) ----


def _extract_bearer_token(authorization: str | None) -> str | None:
    """Extract Bearer token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:].strip() or None


async def get_current_user_optional(
    authorization: Annotated[str | None, Header()] = None,
) -> dict | None:
    """
    Dependency: verify Supabase JWT from Authorization header.
    Returns payload (sub, email, role, ...) or None if not authenticated.
    """
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    return verify_supabase_token(token)


async def get_current_user(
    user: Annotated[dict | None, Depends(get_current_user_optional)] = None,
) -> dict:
    """
    Dependency: require authenticated user. Raises 401 if not authenticated.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
