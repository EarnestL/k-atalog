"""Photocards API."""

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_group_or_404
from app.schemas.group import GroupSchema
from app.schemas.photocard import (
    GroupPhotocardsResponseSchema,
    PhotocardSchema,
)
from app.services.data_loader import (
    get_photocards_async,
    get_photocards_by_group_async,
    get_photocards_by_group_paginated_async,
)

router = APIRouter(prefix="/photocards", tags=["photocards"])


@router.get("", response_model=list[PhotocardSchema])
async def list_photocards() -> list[PhotocardSchema]:
    """List all photocards."""
    return await get_photocards_async()


@router.get("/by-group/{group_id}", response_model=GroupPhotocardsResponseSchema)
async def list_photocards_by_group(
    group: GroupSchema = Depends(get_group_or_404),
    limit: int = Query(40, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
) -> GroupPhotocardsResponseSchema:
    """List photocards for a group (paginated)."""
    result = await get_photocards_by_group_paginated_async(
        group.id, limit=limit, offset=offset
    )
    return GroupPhotocardsResponseSchema(
        photocards=result["photocards"],
        total_photocards=result["total_photocards"],
    )
