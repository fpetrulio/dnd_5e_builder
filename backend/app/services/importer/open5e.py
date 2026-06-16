from __future__ import annotations

import json
import re
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.homebrew import ResourceCache

_ABILITY_MAP = {
    "strength": "str", "dexterity": "dex", "constitution": "con",
    "intelligence": "int", "wisdom": "wis", "charisma": "cha",
    "str": "str", "dex": "dex", "con": "con",
    "int": "int", "wis": "wis", "cha": "cha",
}

_SAVE_MAP = {
    "Strength": "str", "Dexterity": "dex", "Constitution": "con",
    "Intelligence": "int", "Wisdom": "wis", "Charisma": "cha",
}

_HIT_DIE_RE = re.compile(r"d(\d+)")


def _parse_hit_die(value: str) -> int:
    m = _HIT_DIE_RE.search(value or "")
    return int(m.group(1)) if m else 8


def _normalize_class(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize an Open5e class object to our internal format."""
    slug = raw.get("key") or raw.get("slug") or ""

    # v2 format
    if "hit_points" in raw:
        hp_data = raw["hit_points"]
        hit_die = _parse_hit_die(hp_data.get("hit_dice", "1d8"))
        prof_data = raw.get("proficiencies", {})
        saves_raw = prof_data.get("saving_throws", [])
    else:
        # v1 format
        hit_die = _parse_hit_die(raw.get("hit_dice", "1d8"))
        saves_raw = [s.strip() for s in raw.get("prof_saving_throws", "").split(",")]
        prof_data = {}

    saving_throws = [
        _SAVE_MAP.get(s.strip(), s.strip().lower()[:3]) for s in saves_raw if s.strip()
    ]

    spellcasting_ability: str | None = None
    is_spellcaster = bool(raw.get("spellcasting") or raw.get("spells"))

    return {
        "id": slug,
        "name": raw.get("name", slug),
        "hit_die": hit_die,
        "saving_throws": saving_throws,
        "spellcasting_ability": spellcasting_ability,
        "is_spellcaster": is_spellcaster,
        "source": "srd",
        "_raw": raw,
    }


def _normalize_race(raw: dict[str, Any]) -> dict[str, Any]:
    slug = raw.get("key") or raw.get("slug") or ""

    # v2 format
    if "ability_score_increases" in raw:
        bonuses: dict[str, int] = {}
        for entry in raw.get("ability_score_increases", []):
            ab_data = entry.get("ability_score", {})
            ab_key = _ABILITY_MAP.get(ab_data.get("key", ""), "")
            if ab_key:
                bonuses[ab_key] = bonuses.get(ab_key, 0) + entry.get("bonus", 0)
        speed_data = raw.get("speed", {})
        speed = speed_data.get("walk", 30) if isinstance(speed_data, dict) else 30
        size_raw = raw.get("size", "M")
        size = {"T": "tiny", "S": "small", "M": "medium", "L": "large"}.get(size_raw, "medium")
    else:
        # v1 format: ability_score_increase is a prose string or list
        bonuses = {}
        asi = raw.get("ability_score_increase", "")
        if isinstance(asi, str) and "increase by 1" in asi.lower():
            bonuses = {"str": 1, "dex": 1, "con": 1, "int": 1, "wis": 1, "cha": 1}
        elif isinstance(asi, list):
            for entry in asi:
                ab = _ABILITY_MAP.get(entry.get("name", "").lower(), "")
                if ab:
                    bonuses[ab] = bonuses.get(ab, 0) + entry.get("bonus", 0)
        speed = raw.get("speed", 30) if isinstance(raw.get("speed"), int) else 30
        size = (raw.get("size") or "Medium").lower()

    subraces = [
        {
            "id": s.get("slug") or s.get("key") or "",
            "name": s.get("name", ""),
            "race_id": slug,
            "ability_bonuses": {},
        }
        for s in raw.get("subraces", [])
    ]

    return {
        "id": slug,
        "name": raw.get("name", slug),
        "size": size,
        "speed": speed,
        "ability_bonuses": bonuses,
        "subraces": subraces,
        "source": "srd",
    }


def _normalize_background(raw: dict[str, Any]) -> dict[str, Any]:
    slug = raw.get("key") or raw.get("slug") or ""
    skills_raw = raw.get("skill_proficiencies") or raw.get("skills") or ""
    if isinstance(skills_raw, str):
        skill_list = [
            s.strip().lower().replace(" ", "_") for s in skills_raw.split(",") if s.strip()
        ]
    elif isinstance(skills_raw, list):
        skill_list = [s.lower().replace(" ", "_") for s in skills_raw]
    else:
        skill_list = []

    return {
        "id": slug,
        "name": raw.get("name", slug),
        "skill_proficiencies": skill_list,
        "tool_proficiencies": [],
        "source": "srd",
    }


async def _cache_get(db: AsyncSession, resource_type: str) -> list[dict[str, Any]] | None:
    result = await db.execute(
        select(ResourceCache).where(
            ResourceCache.source == "open5e",
            ResourceCache.resource_type == resource_type,
        )
    )
    rows = result.scalars().all()
    if not rows:
        return None
    return [json.loads(r.data_json) for r in rows]


async def _cache_set(db: AsyncSession, resource_type: str, items: list[dict[str, Any]]) -> None:
    # Clear old cache for this type
    old = await db.execute(
        select(ResourceCache).where(
            ResourceCache.source == "open5e",
            ResourceCache.resource_type == resource_type,
        )
    )
    for row in old.scalars().all():
        await db.delete(row)

    for item in items:
        db.add(
            ResourceCache(
                source="open5e",
                resource_type=resource_type,
                resource_key=item.get("id", ""),
                data_json=json.dumps(item),
            )
        )
    await db.commit()


async def _fetch_all(path: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    params: dict[str, Any] = {"limit": 100}
    async with httpx.AsyncClient(base_url=settings.open5e_base_url, timeout=15.0) as client:
        while True:
            r = await client.get(path, params=params)
            r.raise_for_status()
            data = r.json()
            batch = data.get("results", data if isinstance(data, list) else [])
            results.extend(batch)
            if not data.get("next"):
                break
            # Extract offset/page from next URL or increment
            params["offset"] = params.get("offset", 0) + 100
    return results


async def get_classes(db: AsyncSession) -> list[dict[str, Any]]:
    cached = await _cache_get(db, "classes")
    if cached:
        return cached

    raw = await _fetch_all("/classes/")
    normalized = [_normalize_class(r) for r in raw]
    await _cache_set(db, "classes", normalized)
    return normalized


async def get_races(db: AsyncSession) -> list[dict[str, Any]]:
    cached = await _cache_get(db, "races")
    if cached:
        return cached

    raw = await _fetch_all("/races/")
    normalized = [_normalize_race(r) for r in raw]
    await _cache_set(db, "races", normalized)
    return normalized


async def get_backgrounds(db: AsyncSession) -> list[dict[str, Any]]:
    cached = await _cache_get(db, "backgrounds")
    if cached:
        return cached

    raw = await _fetch_all("/backgrounds/")
    normalized = [_normalize_background(r) for r in raw]
    await _cache_set(db, "backgrounds", normalized)
    return normalized


async def get_spells(
    db: AsyncSession,
    level: int | None = None,
    class_name: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    if level is not None:
        params["level_int"] = level
    if class_name:
        params["dnd_class"] = class_name

    async with httpx.AsyncClient(base_url=settings.open5e_base_url, timeout=15.0) as client:
        r = await client.get("/spells/", params=params)
        r.raise_for_status()
        data = r.json()
        results: list[dict[str, Any]] = data.get("results", [])
        return results
