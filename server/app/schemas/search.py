"""Search response schema."""

from typing import List

from pydantic import BaseModel

from app.schemas.group import GroupSchema
from app.schemas.member import MemberSchema
from app.schemas.photocard import PhotocardSchema


class SearchResultSchema(BaseModel):
    """Combined search result (matches client searchPhotocards return)."""

    groups: List[GroupSchema]
    members: List[MemberSchema]
    photocards: List[PhotocardSchema]
