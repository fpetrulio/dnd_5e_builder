from __future__ import annotations

import math
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.character import Character, CharacterSnapshot
from app.schemas.character import (
    CharacterCreate,
    CharacterResponse,
    CharacterUpdate,
    LevelUpChoicesIn,
    SnapshotOut,
)
from app.services.rules_engine import compute_stats
from app.services.rules_engine.tables import ASI_LEVELS, HIT_DICE, SUBCLASS_LEVELS

router = APIRouter()

MAX_LEVEL = 20
PRIMARY_CLASS_IDX = 0


def _build_response(char: Character) -> dict[str, Any]:
    state = char.state
    computed = compute_stats(state)
    return {
        "id": char.id,
        "name": char.name,
        "state": state,
        "computed": computed,
        "created_at": str(char.created_at),
    }


async def _get_or_404(character_id: str, db: AsyncSession) -> Character:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    return char


@router.get("/")
async def list_characters(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    result = await db.execute(select(Character).order_by(Character.updated_at.desc()))
    return [_build_response(c) for c in result.scalars().all()]


@router.post("/", status_code=201, response_model=CharacterResponse)
async def create_character(
    body: CharacterCreate, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = Character(id=str(uuid.uuid4()), name=body.name)
    char.state = body.state.model_dump()
    db.add(char)
    await db.commit()
    await db.refresh(char)
    return _build_response(char)


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)
    return _build_response(char)


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: str, body: CharacterUpdate, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)
    if body.name is not None:
        char.name = body.name
    if body.state is not None:
        char.state = body.state
    await db.commit()
    return _build_response(char)


@router.delete("/{character_id}", status_code=204)
async def delete_character(character_id: str, db: AsyncSession = Depends(get_db)) -> None:
    char = await _get_or_404(character_id, db)
    await db.delete(char)
    await db.commit()


@router.get("/{character_id}/stats")
async def get_character_stats(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)
    return compute_stats(char.state)


# ─── Snapshots ───────────────────────────────────────────────────────────────

@router.get("/{character_id}/snapshots", response_model=list[SnapshotOut])
async def list_snapshots(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    await _get_or_404(character_id, db)
    result = await db.execute(
        select(CharacterSnapshot)
        .where(CharacterSnapshot.character_id == character_id)
        .order_by(CharacterSnapshot.level)
    )
    return [
        {"id": s.id, "level": s.level, "created_at": str(s.created_at)}
        for s in result.scalars().all()
    ]


@router.get("/{character_id}/snapshot/{level}")
async def get_snapshot(
    character_id: str, level: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)
    result = await db.execute(
        select(CharacterSnapshot).where(
            CharacterSnapshot.character_id == character_id,
            CharacterSnapshot.level == level,
        )
    )
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(404, f"Snapshot at level {level} not found")
    state = snap.state
    return {
        "id": char.id,
        "name": char.name,
        "state": state,
        "computed": compute_stats(state),
        "created_at": str(snap.created_at),
    }


# ─── Level Up ────────────────────────────────────────────────────────────────

@router.post("/{character_id}/level-up", response_model=CharacterResponse)
async def level_up(
    character_id: str,
    choices: LevelUpChoicesIn,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)
    state = char.state

    classes: list[dict[str, Any]] = state.get("classes", [])
    if not classes:
        raise HTTPException(400, "Character has no class defined")

    total_level: int = sum(c.get("level", 0) for c in classes)
    if total_level >= MAX_LEVEL:
        raise HTTPException(400, f"Already at maximum level {MAX_LEVEL}")

    # Snapshot current state before any changes
    snap = CharacterSnapshot(
        character_id=character_id,
        level=total_level,
        state_json=char.state_json,
    )
    db.add(snap)

    new_state: dict[str, Any] = dict(state)
    new_classes: list[dict[str, Any]] = [dict(c) for c in classes]

    # Level up primary class
    primary = new_classes[PRIMARY_CLASS_IDX]
    new_class_level: int = primary.get("level", 1) + 1
    primary["level"] = new_class_level
    class_id: str = str(primary.get("class_id", "fighter"))

    # Apply subclass if offered
    if choices.subclass_id and not primary.get("subclass_id"):
        primary["subclass_id"] = choices.subclass_id

    new_state["classes"] = new_classes
    new_state["current_level"] = total_level + 1

    # HP roll — store raw die value; engine adds CON modifier per level
    die: int = HIT_DICE.get(class_id, 8)
    avg: int = math.ceil(die / 2) + 1

    if choices.hp_method == "average":
        hp_gain = avg
    elif choices.hp_value is not None:
        hp_gain = max(1, min(die, choices.hp_value))
    else:
        hp_gain = avg

    hp_rolls: list[int] = list(state.get("hp_rolls", []))
    hp_rolls.append(hp_gain)
    new_state["hp_rolls"] = hp_rolls

    # ASI / feat
    if choices.asi_choice is not None:
        asi = choices.asi_choice
        scores: dict[str, int] = dict(state.get("ability_scores", {}))
        if asi.method == "single" and asi.ability_single:
            scores[asi.ability_single] = min(20, scores.get(asi.ability_single, 10) + 2)
        elif asi.method == "split" and asi.ability_a and asi.ability_b:
            scores[asi.ability_a] = min(20, scores.get(asi.ability_a, 10) + 1)
            scores[asi.ability_b] = min(20, scores.get(asi.ability_b, 10) + 1)
        elif asi.method == "feat" and asi.feat_name:
            feats: list[str] = list(state.get("feats", []))
            feats.append(asi.feat_name)
            new_state["feats"] = feats
        new_state["ability_scores"] = scores

    # Extra skill proficiencies (e.g. Expertise, Rogue extras)
    if choices.new_skill_proficiencies:
        profs: list[str] = list(state.get("skill_proficiencies", []))
        for skill in choices.new_skill_proficiencies:
            if skill not in profs:
                profs.append(skill)
        new_state["skill_proficiencies"] = profs

    char.state = new_state
    await db.commit()
    await db.refresh(char)
    return _build_response(char)


# ─── Revert ──────────────────────────────────────────────────────────────────

@router.post("/{character_id}/revert/{level}", response_model=CharacterResponse)
async def revert_to_level(
    character_id: str, level: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await _get_or_404(character_id, db)

    result = await db.execute(
        select(CharacterSnapshot).where(
            CharacterSnapshot.character_id == character_id,
            CharacterSnapshot.level == level,
        )
    )
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(404, f"Snapshot at level {level} not found")

    # Restore state
    char.state_json = snap.state_json

    # Delete this and all later snapshots (they become invalid after revert)
    del_result = await db.execute(
        select(CharacterSnapshot).where(
            CharacterSnapshot.character_id == character_id,
            CharacterSnapshot.level >= level,
        )
    )
    for old_snap in del_result.scalars().all():
        await db.delete(old_snap)

    await db.commit()
    await db.refresh(char)
    return _build_response(char)


# ─── Level-up metadata ───────────────────────────────────────────────────────

@router.get("/{character_id}/level-up-info")
async def get_level_up_info(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Return what the next level-up will require for this character."""
    char = await _get_or_404(character_id, db)
    state = char.state

    classes: list[dict[str, Any]] = state.get("classes", [])
    if not classes:
        raise HTTPException(400, "Character has no class defined")

    total_level: int = sum(c.get("level", 0) for c in classes)
    if total_level >= MAX_LEVEL:
        return {"can_level_up": False, "reason": "Already at max level"}

    primary = classes[PRIMARY_CLASS_IDX]
    class_id: str = str(primary.get("class_id", "fighter"))
    new_class_level: int = primary.get("level", 1) + 1
    die: int = HIT_DICE.get(class_id, 8)

    asi_levels = ASI_LEVELS.get(class_id, [])
    has_asi = new_class_level in asi_levels
    subclass_level = SUBCLASS_LEVELS.get(class_id, 3)
    has_subclass = new_class_level == subclass_level and not primary.get("subclass_id")

    return {
        "can_level_up": True,
        "new_total_level": total_level + 1,
        "new_class_level": new_class_level,
        "class_id": class_id,
        "hit_die": die,
        "average_hp": math.ceil(die / 2) + 1,
        "has_asi": has_asi,
        "has_subclass_choice": has_subclass,
    }
