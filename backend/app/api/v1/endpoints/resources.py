from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.importer.open5e import get_backgrounds, get_classes, get_races, get_spells

router = APIRouter()


@router.get("/classes")
async def list_classes(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    return await get_classes(db)


@router.get("/races")
async def list_races(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    return await get_races(db)


@router.get("/backgrounds")
async def list_backgrounds(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    return await get_backgrounds(db)


@router.get("/spells")
async def list_spells(
    level: int | None = Query(None),
    classes: str | None = Query(None),
    school: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    return await get_spells(db, level=level, class_name=classes, limit=limit, offset=offset)
