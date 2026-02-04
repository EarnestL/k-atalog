"""Photocards API."""

from fastapi import APIRouter, Depends

from app.api.deps import get_group_or_404
from app.schemas.group import GroupSchema
from app.schemas.photocard import PhotocardSchema
from app.services.data_loader import (
    get_photocards_async,
    get_photocards_by_group_async,
)

router = APIRouter(prefix="/photocards", tags=["photocards"])


@router.get("", response_model=list[PhotocardSchema])
async def list_photocards() -> list[PhotocardSchema]:
    """List all photocards."""
    return await get_photocards_async()


@router.get("/by-group/{group_id}", response_model=list[PhotocardSchema])
async def list_photocards_by_group(
    group: GroupSchema = Depends(get_group_or_404),
) -> list[PhotocardSchema]:
    """List photocards for a group."""
    return await get_photocards_by_group_async(group.id)
