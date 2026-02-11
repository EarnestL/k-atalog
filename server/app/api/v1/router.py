"""Aggregate API v1 routes."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, groups, members, photocards, search, submissions
from app.core.config import get_settings

api_router = APIRouter()
settings = get_settings()

api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(groups.router)
api_router.include_router(members.router)
api_router.include_router(photocards.router)
api_router.include_router(search.router)
api_router.include_router(submissions.router)
