"""Submission schema – user photocard submissions with status."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SubmissionSchema(BaseModel):
    """Submission record: photocard fields + user email, timestamp, status."""

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
    user_email: str = Field(..., alias="userEmail")
    submitted_at: datetime = Field(..., alias="submittedAt")
    status: Literal["accepted", "rejected", "pending"]
    photocard_id: Optional[str] = Field(None, alias="photocardId")
