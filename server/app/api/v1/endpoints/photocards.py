"""Photocards API."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_group_or_404
from app.core.db import is_connected
from app.schemas.group import GroupSchema
from app.schemas.photocard import (
    GroupPhotocardsResponseSchema,
    PhotocardCreateSchema,
    PhotocardSchema,
)
from app.services.data_loader import (
    get_photocards_async,
    get_photocards_by_group_async,
    get_photocards_by_group_paginated_async,
    insert_photocard_async,
    insert_submission_async,
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


@router.post("", response_model=PhotocardSchema, status_code=status.HTTP_201_CREATED)
async def create_photocard(
    payload: PhotocardCreateSchema,
    user: dict = Depends(get_current_user),
) -> PhotocardSchema:
    """Create a new photocard. Requires authentication and MongoDB."""
    if not is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Photocard creation requires MongoDB (MONGODB_URI not configured)",
        )
    pc = await insert_photocard_async(
        member_name=payload.member_name,
        group_name=payload.group_name,
        album=payload.album,
        version=payload.version,
        year=payload.year,
        type_=payload.type,
        image_url=payload.image_url,
        back_image_url=payload.back_image_url,
    )
    if pc is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to create photocard",
        )
    user_email = user.get("email") or ""
    await insert_submission_async(
        member_name=payload.member_name,
        group_name=payload.group_name,
        album=payload.album,
        version=payload.version,
        year=payload.year,
        type_=payload.type,
        image_url=payload.image_url,
        back_image_url=payload.back_image_url,
        user_email=user_email,
        photocard_id=pc.id,
        status="accepted",
    )
    return pc
