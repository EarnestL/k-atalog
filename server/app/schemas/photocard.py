"""Photocard-related Pydantic schemas."""

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class GroupPhotocardsResponseSchema(BaseModel):
    """Paginated photocards for a group (matches client expectation)."""

    model_config = ConfigDict(populate_by_name=True)

    photocards: List["PhotocardSchema"]
    total_photocards: int = Field(..., alias="totalPhotocards")


class PhotocardSchema(BaseModel):
    """Photocard schema (matches client Photocard)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    member_id: str = Field(..., alias="memberId")
    member_name: str = Field(..., alias="memberName")
    group_id: str = Field(..., alias="groupId")
    group_name: str = Field(..., alias="groupName")
    album: str
    version: str
    year: int
    type: Literal["album", "pob", "fansign", "special"]
    image_url: str = Field(..., alias="imageUrl")
    back_image_url: Optional[str] = Field(None, alias="backImageUrl")
