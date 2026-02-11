"""Load and expose catalog data (groups, members, photocards) from file or MongoDB."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from bson import ObjectId

from app.core.db import (
    GROUPS_COLLECTION,
    PHOTOCARDS_COLLECTION,
    SUBMISSIONS_COLLECTION,
    get_database,
    is_connected,
)
from app.core.logging_config import get_logger
from app.schemas.group import GroupDataSchema, GroupSchema
from app.schemas.member import MemberSchema
from app.schemas.photocard import PhotocardSchema
from app.schemas.submission import SubmissionSchema
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
    """If MongoDB is connected and collections are empty, seed from file/hardcoded data.
    Uses MongoDB _id as the group id in API responses; photocards get groupId = that _id.
    """
    db = get_database()
    if db is None:
        return
    groups_coll = db[GROUPS_COLLECTION]
    photocards_coll = db[PHOTOCARDS_COLLECTION]
    if await groups_coll.count_documents({}) > 0:
        return
    raw = _raw_fallback()
    groups_raw = raw.get("groups", [])
    # Map legacy group id -> MongoDB _id (string) so photocards can use it as groupId
    group_id_to_mongo_id: dict[str, str] = {}
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
        result = await groups_coll.insert_one(group.model_dump(by_alias=True))
        if result.inserted_id:
            group_id_to_mongo_id[g_data.id] = str(result.inserted_id)
    for p in raw.get("photocards", []):
        doc = PhotocardSchema.model_validate(p).model_dump(by_alias=True)
        # Store groupId as ObjectId for proper references and indexing
        legacy_group_id = doc.get("groupId")
        if legacy_group_id and legacy_group_id in group_id_to_mongo_id:
            doc["groupId"] = ObjectId(group_id_to_mongo_id[legacy_group_id])
        await photocards_coll.insert_one(doc)
    logger.info("Seeded MongoDB with %d groups and %d photocards", len(groups_raw), len(raw.get("photocards", [])))


# ---- Async data access (MongoDB or in-memory) ----

def _doc_for_validation(d: dict) -> dict:
    """Convert MongoDB doc for Pydantic: use _id as id (string), drop _id, stringify any ObjectId values."""
    if d is None:
        return d
    out = {}
    for k, v in d.items():
        if k == "_id":
            continue
        out[k] = str(v) if isinstance(v, ObjectId) else v
    if "_id" in d:
        out["id"] = str(d["_id"])
    return out


def _group_doc_for_validation(d: dict) -> dict:
    """Use _id as group id; strip _id from group and each member."""
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


def _is_objectid_string(s: str) -> bool:
    """True if s is a 24-char hex string (valid MongoDB ObjectId)."""
    return len(s) == 24 and all(c in "0123456789abcdefABCDEF" for c in s)


async def get_group_by_id_async(group_id: str) -> GroupSchema | None:
    """Return a single group by id (MongoDB _id string or legacy id) or None."""
    if is_connected():
        db = get_database()
        if db is not None:
            doc = None
            if _is_objectid_string(group_id):
                try:
                    doc = await db[GROUPS_COLLECTION].find_one(
                        {"_id": ObjectId(group_id)},
                        max_time_ms=MONGODB_QUERY_TIMEOUT_MS,
                    )
                except Exception:
                    pass
            if doc is None:
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


async def get_photocards_by_group_paginated_async(
    group_id: str,
    limit: int = 40,
    offset: int = 0,
) -> dict:
    """Return paginated photocards for a group and total count."""
    all_pc = await get_photocards_by_group_async(group_id)
    total = len(all_pc)
    page = all_pc[offset : offset + limit]
    return {"photocards": page, "total_photocards": total}


async def get_photocards_by_member_async(member_id: str) -> List[PhotocardSchema]:
    """Return photocards for a member."""
    all_pc = await get_photocards_async()
    return [p for p in all_pc if p.member_id == member_id]


async def search_catalog_async(
    query: str,
    pc_limit: int = 40,
    pc_offset: int = 0,
) -> dict:
    """Search groups, members, and photocards by query string. Photocards are paginated."""
    q = query.lower().strip()
    groups = await get_groups_async()
    all_pc = await get_photocards_async()
    if not q:
        all_members = [m for g in groups for m in g.members]
        total_photocards = len(all_pc)
        photocards = all_pc[pc_offset : pc_offset + pc_limit]
        return {
            "groups": groups,
            "members": all_members,
            "photocards": photocards,
            "total_photocards": total_photocards,
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
    total_photocards = len(matched_photocards)
    photocards = matched_photocards[pc_offset : pc_offset + pc_limit]
    return {
        "groups": matched_groups,
        "members": matched_members,
        "photocards": photocards,
        "total_photocards": total_photocards,
    }


def _normalize_id(s: str) -> str:
    """Lowercase and remove spaces for memberId/groupId."""
    return "".join(s.lower().split())


async def insert_photocard_async(
    member_name: str,
    group_name: str,
    album: str,
    version: str,
    year: int,
    type_: str,
    image_url: str,
    back_image_url: str | None = None,
) -> PhotocardSchema | None:
    """Insert a new photocard into MongoDB. Returns created photocard or None if not connected."""
    db = get_database()
    if db is None:
        return None
    member_id = _normalize_id(member_name)
    group_id_normalized = _normalize_id(group_name)
    group_doc = await db[GROUPS_COLLECTION].find_one(
        {"id": group_id_normalized}, max_time_ms=MONGODB_QUERY_TIMEOUT_MS
    )
    group_id = str(group_doc["_id"]) if group_doc else group_id_normalized
    pc_id = f"pc-{uuid.uuid4().hex[:12]}"
    doc = {
        "id": pc_id,
        "memberId": member_id,
        "memberName": member_name,
        "groupId": ObjectId(group_id) if _is_objectid_string(group_id) else group_id,
        "groupName": group_name,
        "album": album,
        "version": version,
        "year": year,
        "type": type_,
        "imageUrl": image_url,
        "backImageUrl": back_image_url,
    }
    await db[PHOTOCARDS_COLLECTION].insert_one(doc)
    return PhotocardSchema.model_validate(_doc_for_validation(doc))


async def insert_submission_async(
    member_name: str,
    group_name: str,
    album: str,
    version: str,
    year: int,
    type_: str,
    image_url: str,
    user_email: str,
    photocard_id: str | None,
    back_image_url: str | None = None,
    status: str = "accepted",
) -> SubmissionSchema | None:
    """Insert a submission record into MongoDB. Returns created submission or None if not connected."""
    db = get_database()
    if db is None:
        return None
    member_id = _normalize_id(member_name)
    group_id_normalized = _normalize_id(group_name)
    group_doc = await db[GROUPS_COLLECTION].find_one(
        {"id": group_id_normalized}, max_time_ms=MONGODB_QUERY_TIMEOUT_MS
    )
    group_id = str(group_doc["_id"]) if group_doc else group_id_normalized
    sub_id = f"sub-{uuid.uuid4().hex[:12]}"
    doc = {
        "id": sub_id,
        "memberId": member_id,
        "memberName": member_name,
        "groupId": group_id,
        "groupName": group_name,
        "album": album,
        "version": version,
        "year": year,
        "type": type_,
        "imageUrl": image_url,
        "backImageUrl": back_image_url,
        "userEmail": user_email,
        "submittedAt": datetime.now(timezone.utc),
        "status": status,
        "photocardId": photocard_id,
    }
    await db[SUBMISSIONS_COLLECTION].insert_one(doc)
    return SubmissionSchema.model_validate(_submission_doc_for_validation(doc))


def _submission_doc_for_validation(d: dict) -> dict:
    """Convert submission MongoDB doc for Pydantic (camelCase aliases)."""
    if d is None:
        return d
    out = {}
    for k, v in d.items():
        if k == "_id":
            continue
        out[k] = str(v) if isinstance(v, ObjectId) else v
    if "id" not in out and "_id" in d:
        out["id"] = str(d["_id"])
    return out


async def get_submissions_by_email_async(user_email: str, limit: int = 50) -> List[SubmissionSchema]:
    """Return submissions for a user, newest first. MongoDB only."""
    db = get_database()
    if db is None:
        return []
    cursor = (
        db[SUBMISSIONS_COLLECTION]
        .find({"userEmail": user_email})
        .sort("submittedAt", -1)
        .limit(limit)
        .max_time_ms(MONGODB_QUERY_TIMEOUT_MS)
    )
    results = []
    async for d in cursor:
        results.append(SubmissionSchema.model_validate(_submission_doc_for_validation(d)))
    return results


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
