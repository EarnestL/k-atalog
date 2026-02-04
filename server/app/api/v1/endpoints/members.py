"""Members API (scoped by group)."""

from fastapi import APIRouter, Depends

from app.api.deps import get_group_or_404, get_member_or_404
from app.schemas.group import GroupSchema
from app.schemas.member import MemberSchema
from app.schemas.photocard import PhotocardSchema
from app.services.data_loader import get_photocards_by_member_async

router = APIRouter(prefix="/groups/{group_id}/members", tags=["members"])


@router.get("", response_model=list[MemberSchema])
async def list_members(
    group: GroupSchema = Depends(get_group_or_404),
) -> list[MemberSchema]:
    """List all members of a group."""
    return group.members


@router.get("/{member_id}", response_model=MemberSchema)
async def get_member(
    member: MemberSchema = Depends(get_member_or_404),
) -> MemberSchema:
    """Get a single member by group id and member id."""
    return member


@router.get("/{member_id}/photocards", response_model=list[PhotocardSchema])
async def list_member_photocards(
    member: MemberSchema = Depends(get_member_or_404),
) -> list[PhotocardSchema]:
    """List photocards for a member."""
    return await get_photocards_by_member_async(member.id)
