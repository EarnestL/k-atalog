"""Photocard-related Pydantic schemas."""

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# Max lengths to prevent DoS and storage abuse
MAX_STRING_LEN = 200
MAX_URL_LEN = 2048


def _validate_https_url(v: str, max_len: int = MAX_URL_LEN) -> str:
    """Validate URL is HTTPS and within length limit."""
    if not v or len(v) > max_len:
        raise ValueError(f"URL must be 1-{max_len} characters")
    v_lower = v.strip().lower()
    if not (v_lower.startswith("https://")):
        raise ValueError("URL must use HTTPS")
    return v.strip()


class PhotocardCreateSchema(BaseModel):
    """Payload for creating a photocard (from form)."""

    model_config = ConfigDict(populate_by_name=True)

    member_name: str = Field(..., alias="memberName", max_length=MAX_STRING_LEN)
    group_name: str = Field(..., alias="groupName", max_length=MAX_STRING_LEN)
    album: str = Field(..., max_length=MAX_STRING_LEN)
    version: str = Field(..., max_length=MAX_STRING_LEN)
    year: int = Field(..., ge=1990, le=2035)
    type: Literal["album", "special"]  # "other" maps to "special"
    image_url: str = Field(..., alias="imageUrl", max_length=MAX_URL_LEN)
    back_image_url: Optional[str] = Field(None, alias="backImageUrl", max_length=MAX_URL_LEN)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: str) -> str:
        return _validate_https_url(v)

    @field_validator("back_image_url")
    @classmethod
    def validate_back_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return _validate_https_url(v)


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
