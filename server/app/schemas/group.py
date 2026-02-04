"""Group-related Pydantic schemas."""

from typing import List

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.member import MemberDataSchema


class GroupDataSchema(BaseModel):
    """Group as returned in list/detail (matches client GroupData)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    korean_name: str = Field(..., alias="koreanName")
    company: str
    debut_year: int = Field(..., alias="debutYear")
    image_url: str = Field(..., alias="imageUrl")
    members: List[MemberDataSchema]


class GroupSchema(BaseModel):
    """Group with members (member objects have no groupId/groupName)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    korean_name: str = Field(..., alias="koreanName")
    company: str
    debut_year: int = Field(..., alias="debutYear")
    image_url: str = Field(..., alias="imageUrl")
    members: List[MemberDataSchema]
