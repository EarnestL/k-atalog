"""Structured logging configuration."""

import logging
import sys
from typing import Any

from app.core.config import get_settings


def setup_logging() -> None:
    """Configure application logging."""
    settings = get_settings()
    level = logging.DEBUG if settings.debug else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    # Reduce noise from third-party libs
    logging.getLogger("uvicorn.access").setLevel(
        logging.WARNING if not settings.debug else logging.DEBUG
    )


def get_logger(name: str) -> logging.Logger:
    """Return a logger for the given module name."""
    return logging.getLogger(name)
