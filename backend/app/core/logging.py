"""Structured logging configuration for the application."""
from __future__ import annotations

import logging
import sys
import time
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


def configure_logging(debug: bool = False) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        stream=sys.stdout,
        level=level,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        force=True,
    )
    # Keep uvicorn logs consistent
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

    # Silence noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if debug else logging.WARNING
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with method, path, status code, and elapsed time."""

    def __init__(self, app: Any, logger: logging.Logger | None = None) -> None:
        super().__init__(app)
        self._log = logger or get_logger("app.http")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            self._log.error(
                "%s %s → ERROR: %s",
                request.method,
                request.url.path,
                exc,
                exc_info=True,
            )
            raise
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            status = response.status_code if response is not None else 500
            level = logging.WARNING if status >= 400 else logging.INFO
            self._log.log(
                level,
                "%s %s → %d  (%.1f ms)",
                request.method,
                request.url.path,
                status,
                elapsed_ms,
            )
