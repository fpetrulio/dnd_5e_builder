from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.importer.open5e import get_backgrounds, get_classes, get_races, get_spells
from app.services.rules_engine.tables import CLASS_FEATURES, CLASS_SKILL_OPTIONS

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


@router.get("/class-skills")
async def list_class_skills() -> dict[str, Any]:
    """Return skill options per class: {class_id: {skills: [...], count: N}}."""
    return {
        cls: {"skills": opts[0], "count": opts[1]}
        for cls, opts in CLASS_SKILL_OPTIONS.items()
    }


@router.get("/class-features")
async def list_class_features(
    class_id: str = Query(..., description="Class slug, e.g. 'fighter'"),
    level: int = Query(1, ge=1, le=20, description="Show features up to this level"),
) -> list[dict[str, Any]]:
    """Return all class features up to the given level."""
    features_by_level = CLASS_FEATURES.get(class_id.lower())
    if features_by_level is None:
        raise HTTPException(404, f"No features found for class '{class_id}'")

    result: list[dict[str, Any]] = []
    for lvl in range(1, level + 1):
        entries = features_by_level.get(lvl, [])
        for name, description in entries:
            result.append({"level": lvl, "name": name, "description": description})
    return result
