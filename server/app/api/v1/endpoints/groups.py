"""Groups API."""

from fastapi import APIRouter, Depends

from app.api.deps import get_group_or_404
from app.schemas.group import GroupSchema
from app.services.data_loader import get_groups_async

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupSchema])
async def list_groups() -> list[GroupSchema]:
    """List all groups with their members."""
    return await get_groups_async()


@router.get("/{group_id}", response_model=GroupSchema)
async def get_group(
    group: GroupSchema = Depends(get_group_or_404),
) -> GroupSchema:
    """Get a single group by id."""
    return group
