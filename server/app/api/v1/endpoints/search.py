"""Search API."""

import logging

from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_settings
from app.schemas.search import SearchResultSchema
from app.services.data_loader import search_catalog_async

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


def _build_search_result(result: dict) -> SearchResultSchema:
    return SearchResultSchema(
        groups=result["groups"],
        members=result["members"],
        photocards=result["photocards"],
    )


# Limit search query length to reduce DoS and logging abuse
SEARCH_QUERY_MAX_LENGTH = 500


@router.get("", response_model=SearchResultSchema)
async def search(
    q: str = Query(
        ...,
        min_length=1,
        max_length=SEARCH_QUERY_MAX_LENGTH,
        description="Search query",
    ),
) -> SearchResultSchema:
    """Search groups, members, and photocards by query string."""
    try:
        result = await search_catalog_async(q)
        return _build_search_result(result)
    except Exception as e:
        logger.exception("Search failed for q=%r: %s", q, e)
        settings = get_settings()
        detail = str(e) if settings.debug else "Search failed. Check server logs."
        raise HTTPException(status_code=500, detail=detail)


@router.get("/all", response_model=SearchResultSchema)
async def search_all() -> SearchResultSchema:
    """Return all groups, members, and photocards (empty query)."""
    try:
        result = await search_catalog_async("")
        return _build_search_result(result)
    except Exception as e:
        logger.exception("Search all failed: %s", e)
        settings = get_settings()
        detail = str(e) if settings.debug else "Search failed. Check server logs."
        raise HTTPException(status_code=500, detail=detail)
