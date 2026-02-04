"""Member-related Pydantic schemas."""

from pydantic import BaseModel, ConfigDict, Field


class MemberDataSchema(BaseModel):
    """Member without group context (for nested in group)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    korean_name: str = Field(..., alias="koreanName")
    image_url: str = Field(..., alias="imageUrl")
    photocard_count: int = Field(..., alias="photocardCount")


# Member in API responses is just member data (no groupId/groupName).
# Callers that need group context have it from the URL or parent group.
MemberSchema = MemberDataSchema
