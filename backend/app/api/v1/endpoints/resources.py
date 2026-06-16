from typing import Any

import httpx
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter()

_http = httpx.AsyncClient(base_url=settings.open5e_base_url, timeout=10.0)


async def _fetch(path: str, params: dict | None = None) -> Any:
    r = await _http.get(path, params=params or {})
    r.raise_for_status()
    return r.json()


@router.get("/classes")
async def get_classes() -> Any:
    return await _fetch("/classes/")


@router.get("/races")
async def get_races() -> Any:
    return await _fetch("/races/")


@router.get("/backgrounds")
async def get_backgrounds() -> Any:
    return await _fetch("/backgrounds/")


@router.get("/feats")
async def get_feats() -> Any:
    return await _fetch("/feats/")


@router.get("/spells")
async def get_spells(
    level: int | None = Query(None),
    classes: str | None = Query(None),
    school: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
) -> Any:
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    if level is not None:
        params["level_int"] = level
    if classes:
        params["dnd_class"] = classes
    if school:
        params["school"] = school
    return await _fetch("/spells/", params)
