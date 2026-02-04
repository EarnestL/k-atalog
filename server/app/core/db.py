"""
MongoDB connection (async via Motor).

- Connection string is read from settings (.env); never logged or exposed.
- Connect only when MONGODB_URI is set; otherwise the app uses file/hardcoded data.
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: Optional[AsyncIOMotorClient] = None


async def connect_mongodb() -> bool:
    """
    Connect to MongoDB using URI from settings.
    Call on app startup only when MONGODB_URI is set.
    Returns True if connected successfully, False otherwise.
    Never logs or exposes the connection string.
    """
    global _client
    settings = get_settings()
    if not settings.mongodb_configured:
        return False
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
        )
        await _client.admin.command("ping")
        return True
    except Exception:
        _client = None
        return False


async def close_mongodb() -> None:
    """Close the MongoDB connection. Call on app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """
    Return the MongoDB database instance, or None if not connected.
    Use this in endpoints when reading/writing via MongoDB.
    """
    if _client is None:
        return None
    settings = get_settings()
    return _client[settings.mongodb_database_name]


def is_connected() -> bool:
    """True if MongoDB client is connected."""
    return _client is not None


# Collection names (used by data_loader)
GROUPS_COLLECTION = "groups"
PHOTOCARDS_COLLECTION = "photocards"
