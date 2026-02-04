"""FastAPI dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

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
