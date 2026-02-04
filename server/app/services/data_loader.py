"""Load and expose catalog data (groups, members, photocards) from file or MongoDB."""

import json
from pathlib import Path
from typing import List

from app.core.db import (
    GROUPS_COLLECTION,
    PHOTOCARDS_COLLECTION,
    get_database,
    is_connected,
)
from app.core.logging_config import get_logger
from app.schemas.group import GroupDataSchema, GroupSchema
from app.schemas.member import MemberSchema
from app.schemas.photocard import PhotocardSchema
from app.services.hardcoded_data import HARDCODED_RAW

logger = get_logger(__name__)

# Max time for a single MongoDB query (ms); prevents requests hanging forever
MONGODB_QUERY_TIMEOUT_MS = 15000

# In-memory store when MongoDB is not used
_groups: List[GroupSchema] = []
_photocards: List[PhotocardSchema] = []


def _data_path() -> Path | None:
    """Resolve path to data.json if it exists."""
    base = Path(__file__).resolve().parent.parent.parent
    for rel in ["data/data.json", "../client/src/data/data.json"]:
        p = (base / rel).resolve()
        if p.exists():
            return p
    return None


def _raw_fallback() -> dict:
    """Return raw dict from file or hardcoded data (no DB)."""
    path = _data_path()
    if path:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return HARDCODED_RAW


def load_data() -> None:
    """Load groups and photocards from JSON file or hardcoded into memory (when not using MongoDB)."""
    global _groups, _photocards
    raw = _raw_fallback()
    groups_raw = raw.get("groups", [])
    _groups = []
    for g in groups_raw:
        g_data = GroupDataSchema.model_validate(g)
        _groups.append(
            GroupSchema(
                id=g_data.id,
                name=g_data.name,
                korean_name=g_data.korean_name,
                company=g_data.company,
                debut_year=g_data.debut_year,
                image_url=g_data.image_url,
                members=list(g_data.members),
            )
        )
    _photocards = [PhotocardSchema.model_validate(p) for p in raw.get("photocards", [])]
    logger.info("Loaded %d groups and %d photocards (in-memory)", len(_groups), len(_photocards))


def _ensure_memory_loaded() -> None:
    """Ensure in-memory data is loaded (for non-MongoDB path)."""
    if not _groups and not _photocards:
        load_data()


# ---- MongoDB seed ----

async def seed_mongodb_if_empty() -> None:
    """If MongoDB is connected and collections are empty, seed from file/hardcoded data."""
    db = get_database()
    if db is None:
        return
    groups_coll = db[GROUPS_COLLECTION]
    photocards_coll = db[PHOTOCARDS_COLLECTION]
    if await groups_coll.count_documents({}) > 0:
        return
    raw = _raw_fallback()
    # Build GroupSchema list and insert as camelCase docs
    groups_raw = raw.get("groups", [])
    for g in groups_raw:
        g_data = GroupDataSchema.model_validate(g)
        group = GroupSchema(
            id=g_data.id,
            name=g_data.name,
            korean_name=g_data.korean_name,
            company=g_data.company,
            debut_year=g_data.debut_year,
            image_url=g_data.image_url,
            members=list(g_data.members),
        )
        await groups_coll.insert_one(group.model_dump(by_alias=True))
    # Photocards
    for p in raw.get("photocards", []):
        doc = PhotocardSchema.model_validate(p).model_dump(by_alias=True)
        await photocards_coll.insert_one(doc)
    logger.info("Seeded MongoDB with %d groups and %d photocards", len(groups_raw), len(raw.get("photocards", [])))


# ---- Async data access (MongoDB or in-memory) ----

def _doc_for_validation(d: dict) -> dict:
    """Strip MongoDB _id so Pydantic validation doesn't see ObjectId."""
    if d is None:
        return d
    return {k: v for k, v in d.items() if k != "_id"}


def _group_doc_for_validation(d: dict) -> dict:
    """Strip _id from group and each member (members do not require groupId/groupName)."""
    if d is None:
        return d
    d = _doc_for_validation(d)
    d["members"] = [_doc_for_validation(m) for m in d.get("members") or []]
    return d


async def get_groups_async() -> List[GroupSchema]:
    """Return all groups. From MongoDB if connected, else from in-memory."""
    if is_connected():
        db = get_database()
        if db is not None:
            cursor = db[GROUPS_COLLECTION].find({}).max_time_ms(MONGODB_QUERY_TIMEOUT_MS)
            return [GroupSchema.model_validate(_group_doc_for_validation(d)) async for d in cursor]
    _ensure_memory_loaded()
    return _groups


async def get_photocards_async() -> List[PhotocardSchema]:
    """Return all photocards. From MongoDB if connected, else from in-memory."""
    if is_connected():
        db = get_database()
        if db is not None:
            cursor = db[PHOTOCARDS_COLLECTION].find({})
            return [PhotocardSchema.model_validate(_doc_for_validation(d)) async for d in cursor]
    _ensure_memory_loaded()
    return _photocards


async def get_group_by_id_async(group_id: str) -> GroupSchema | None:
    """Return a single group by id or None."""
    if is_connected():
        db = get_database()
        if db is not None:
            doc = await db[GROUPS_COLLECTION].find_one(
                {"id": group_id}, max_time_ms=MONGODB_QUERY_TIMEOUT_MS
            )
            return GroupSchema.model_validate(_group_doc_for_validation(doc)) if doc else None
    _ensure_memory_loaded()
    for g in _groups:
        if g.id == group_id:
            return g
    return None


async def get_member_by_id_async(group_id: str, member_id: str) -> MemberSchema | None:
    """Return a single member by group_id and member_id or None."""
    group = await get_group_by_id_async(group_id)
    if not group:
        return None
    for m in group.members:
        if m.id == member_id:
            return m
    return None


async def get_photocards_by_group_async(group_id: str) -> List[PhotocardSchema]:
    """Return photocards for a group."""
    all_pc = await get_photocards_async()
    return [p for p in all_pc if p.group_id == group_id]


async def get_photocards_by_member_async(member_id: str) -> List[PhotocardSchema]:
    """Return photocards for a member."""
    all_pc = await get_photocards_async()
    return [p for p in all_pc if p.member_id == member_id]


async def search_catalog_async(query: str) -> dict:
    """Search groups, members, and photocards by query string."""
    q = query.lower().strip()
    groups = await get_groups_async()
    all_pc = await get_photocards_async()
    if not q:
        return {
            "groups": groups,
            "members": [m for g in groups for m in g.members],
            "photocards": all_pc,
        }
    matched_groups = [
        g for g in groups
        if q in (g.name or "").lower() or q in (g.korean_name or "")
    ]
    matched_members = [
        m for g in groups for m in g.members
        if q in (m.name or "").lower() or q in (m.korean_name or "")
    ]
    matched_photocards = [
        p for p in all_pc
        if q in (p.album or "").lower() or q in (p.member_name or "").lower()
        or q in (p.group_name or "").lower() or q in (p.version or "").lower()
    ]
    return {
        "groups": matched_groups,
        "members": matched_members,
        "photocards": matched_photocards,
    }


# ---- Sync access (kept for backward compatibility; prefer async) ----

def get_groups() -> List[GroupSchema]:
    """Return all groups from in-memory (call only when not using MongoDB)."""
    _ensure_memory_loaded()
    return _groups


def get_photocards() -> List[PhotocardSchema]:
    """Return all photocards from in-memory."""
    _ensure_memory_loaded()
    return _photocards


def get_group_by_id(group_id: str) -> GroupSchema | None:
    """Return a single group by id (in-memory only)."""
    _ensure_memory_loaded()
    for g in _groups:
        if g.id == group_id:
            return g
    return None


def get_member_by_id(group_id: str, member_id: str) -> MemberSchema | None:
    """Return a single member (in-memory only)."""
    group = get_group_by_id(group_id)
    if not group:
        return None
    for m in group.members:
        if m.id == member_id:
            return m
    return None


def get_photocards_by_member(member_id: str) -> List[PhotocardSchema]:
    """Return photocards for a member (in-memory only)."""
    _ensure_memory_loaded()
    return [p for p in _photocards if p.member_id == member_id]


def get_photocards_by_group(group_id: str) -> List[PhotocardSchema]:
    """Return photocards for a group (in-memory only)."""
    _ensure_memory_loaded()
    return [p for p in _photocards if p.group_id == group_id]


def search_catalog(query: str) -> dict:
    """Search (in-memory only). Use search_catalog_async when using MongoDB."""
    _ensure_memory_loaded()
    q = query.lower().strip()
    if not q:
        return {
            "groups": _groups,
            "members": [m for g in _groups for m in g.members],
            "photocards": _photocards,
        }
    matched_groups = [g for g in _groups if q in g.name.lower() or q in g.korean_name]
    matched_members = [
        m for g in _groups for m in g.members
        if q in m.name.lower() or q in m.korean_name
    ]
    matched_photocards = [
        p for p in _photocards
        if q in p.album.lower() or q in p.member_name.lower()
        or q in p.group_name.lower() or q in p.version.lower()
    ]
    return {
        "groups": matched_groups,
        "members": matched_members,
        "photocards": matched_photocards,
    }
