from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.importer.open5e import get_backgrounds, get_classes, get_races, get_spells
from app.services.rules_engine.tables import (
    ARMOR_PROFICIENCIES,
    ARMOR_TABLE,
    CLASS_FEATURES,
    CLASS_SKILL_OPTIONS,
    FEATS,
    SUBCLASSES,
)

router = APIRouter()
_log = logging.getLogger("app.resources")


@router.get("/classes")
async def list_classes(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return await get_classes(db)
    except Exception as exc:
        _log.error("Failed to load classes: %s", exc, exc_info=True)
        raise


@router.get("/races")
async def list_races(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return await get_races(db)
    except Exception as exc:
        _log.error("Failed to load races: %s", exc, exc_info=True)
        raise


@router.get("/backgrounds")
async def list_backgrounds(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return await get_backgrounds(db)
    except Exception as exc:
        _log.error("Failed to load backgrounds: %s", exc, exc_info=True)
        raise


@router.get("/feats")
async def list_feats() -> list[dict[str, str]]:
    """Return all SRD feats."""
    return FEATS


@router.get("/spells")
async def list_spells(
    level: int | None = Query(None),
    classes: str | None = Query(None),
    school: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    try:
        return await get_spells(db, level=level, class_name=classes, limit=limit, offset=offset)
    except Exception as exc:
        _log.error("Failed to load spells: %s", exc, exc_info=True)
        raise


@router.get("/armor")
async def list_armor(
    class_id: str = Query(..., description="Class slug, e.g. 'fighter'"),
) -> list[dict[str, Any]]:
    """Return armors the given class is proficient with, ordered by AC."""
    profs = ARMOR_PROFICIENCIES.get(class_id.lower(), [])
    result: list[dict[str, Any]] = [
        {
            "id": armor_id,
            "name": armor_id.replace("-", " ").title(),
            "base_ac": base_ac,
            "type": armor_type,
        }
        for armor_id, (base_ac, armor_type) in ARMOR_TABLE.items()
        if armor_type in profs
    ]
    result.sort(key=lambda x: x["base_ac"])
    return result


@router.get("/subclasses")
async def list_subclasses(
    class_id: str = Query(..., description="Class slug, e.g. 'fighter'"),
) -> list[dict[str, Any]]:
    """Return SRD subclasses for a given class."""
    return SUBCLASSES.get(class_id.lower(), [])


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
        _log.warning("No features found for class '%s'", class_id)
        raise HTTPException(404, f"No features found for class '{class_id}'")

    result: list[dict[str, Any]] = []
    for lvl in range(1, level + 1):
        entries = features_by_level.get(lvl, [])
        for name, description in entries:
            result.append({"level": lvl, "name": name, "description": description})
    return result
