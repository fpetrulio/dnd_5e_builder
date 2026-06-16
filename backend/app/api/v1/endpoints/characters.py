from __future__ import annotations

import logging
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
from app.services.rules_engine.tables import (
    ASI_LEVELS,
    HIT_DICE,
    MULTICLASS_PREREQS,
    SUBCLASS_LEVELS,
)

router = APIRouter()
_log = logging.getLogger("app.characters")

MAX_LEVEL = 20
PRIMARY_CLASS_IDX = 0
ABILITY_LABELS: dict[str, str] = {
    "str": "STR", "dex": "DEX", "con": "CON",
    "int": "INT", "wis": "WIS", "cha": "CHA",
}


def _check_prereqs(class_id: str, scores: dict[str, int]) -> tuple[bool, str | None]:
    """Return (meets, missing_description). Any one AND-group must be fully satisfied."""
    groups = MULTICLASS_PREREQS.get(class_id, [])
    if not groups:
        return True, None
    for group in groups:
        if all(scores.get(ab, 0) >= min_val for ab, min_val in group.items()):
            return True, None
    # Build a human-readable description of what's needed
    parts = [
        " and ".join(f"{ABILITY_LABELS[ab]} {v}" for ab, v in group.items())
        for group in groups
    ]
    return False, " or ".join(parts)


def _class_level_up_info(
    class_id: str, new_class_level: int, existing_subclass: str | None
) -> dict[str, Any]:
    die: int = HIT_DICE.get(class_id, 8)
    return {
        "class_id": class_id,
        "hit_die": die,
        "average_hp": math.ceil(die / 2) + 1,
        "has_asi": new_class_level in ASI_LEVELS.get(class_id, []),
        "has_subclass_choice": (
            new_class_level == SUBCLASS_LEVELS.get(class_id, 3)
            and not existing_subclass
        ),
    }


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
    _log.info("Created character '%s' (id=%s)", char.name, char.id)
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

    # Determine which class entry to level up
    target_class_id: str = choices.new_class_id or str(
        new_classes[PRIMARY_CLASS_IDX].get("class_id", "fighter")
    )

    existing_entry: dict[str, Any] | None = next(
        (c for c in new_classes if c.get("class_id") == target_class_id), None
    )

    if existing_entry is not None:
        new_class_level: int = existing_entry.get("level", 1) + 1
        existing_entry["level"] = new_class_level
        if choices.subclass_id and not existing_entry.get("subclass_id"):
            existing_entry["subclass_id"] = choices.subclass_id
    else:
        # Starting a new multiclass entry at level 1
        scores_check: dict[str, int] = state.get("ability_scores", {})
        meets, missing = _check_prereqs(target_class_id, scores_check)
        if not meets:
            raise HTTPException(400, f"Missing multiclass prerequisites: {missing}")
        new_class_level = 1
        new_entry: dict[str, Any] = {"class_id": target_class_id, "level": 1}
        if choices.subclass_id:
            new_entry["subclass_id"] = choices.subclass_id
        new_classes.append(new_entry)

    new_state["classes"] = new_classes
    new_state["current_level"] = total_level + 1

    # HP — use the die of the class that was leveled
    die: int = HIT_DICE.get(target_class_id, 8)
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

    # Extra skill proficiencies
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


# ─── Progression ─────────────────────────────────────────────────────────────

@router.get("/{character_id}/progression")
async def get_progression(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """Return key computed stats at each snapshot level, plus the current level."""
    char = await _get_or_404(character_id, db)

    result = await db.execute(
        select(CharacterSnapshot)
        .where(CharacterSnapshot.character_id == character_id)
        .order_by(CharacterSnapshot.level)
    )
    snapshots = result.scalars().all()

    def _point(state: dict[str, Any]) -> dict[str, Any]:
        s = compute_stats(state)
        return {
            "level": s["total_level"],
            "hp": s["hp_max"],
            "ac": s["armor_class"],
            "proficiency_bonus": s["proficiency_bonus"],
            "initiative": s["initiative"],
            "speed": s["speed"],
        }

    data = [_point(snap.state) for snap in snapshots]
    data.append(_point(char.state))
    return data


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

    # Primary class info
    primary = classes[PRIMARY_CLASS_IDX]
    class_id: str = str(primary.get("class_id", "fighter"))
    new_class_level: int = primary.get("level", 1) + 1

    primary_info = _class_level_up_info(class_id, new_class_level, primary.get("subclass_id"))
    ability_scores: dict[str, int] = state.get("ability_scores", {})

    # Existing secondary classes
    existing_class_ids = {str(c.get("class_id", "")) for c in classes}

    # Multiclass options: existing secondary classes + available new classes
    multiclass_options: list[dict[str, Any]] = []

    # Existing secondary classes (index 1+)
    for c in classes[1:]:
        cid = str(c.get("class_id", ""))
        cur_level: int = c.get("level", 1)
        new_lvl = cur_level + 1
        info = _class_level_up_info(cid, new_lvl, c.get("subclass_id"))
        multiclass_options.append({
            **info,
            "current_level": cur_level,
            "new_level": new_lvl,
            "meets_prereqs": True,
            "missing_prereqs": None,
            "is_new_class": False,
        })

    # New classes not yet taken
    for cid in MULTICLASS_PREREQS:
        if cid in existing_class_ids:
            continue
        meets, missing = _check_prereqs(cid, ability_scores)
        info = _class_level_up_info(cid, 1, None)
        multiclass_options.append({
            **info,
            "current_level": 0,
            "new_level": 1,
            "meets_prereqs": meets,
            "missing_prereqs": missing,
            "is_new_class": True,
        })

    return {
        "can_level_up": True,
        "new_total_level": total_level + 1,
        "new_class_level": new_class_level,
        **primary_info,
        "multiclass_options": multiclass_options,
    }


# ─── Simulate ────────────────────────────────────────────────────────────────

MIN_HIT_CHANCE = 0.05
MAX_HIT_CHANCE = 0.95
HIT_FORMULA_BASE = 21


@router.post("/{character_id}/simulate")
async def simulate_character(
    character_id: str,
    body: dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Return DPR estimates for a character against a range of target ACs."""
    char = await _get_or_404(character_id, db)
    computed = compute_stats(char.state)

    mods = computed["ability_modifiers"]
    prof = computed["proficiency_bonus"]

    num_dice: int = int(body.get("num_dice", 1))
    die_size: int = int(body.get("die_size", 8))
    num_attacks: int = int(body.get("num_attacks", 1))
    default_attack_bonus = max(mods.get("str", 0), mods.get("dex", 0)) + prof
    default_damage_bonus = max(mods.get("str", 0), mods.get("dex", 0))
    attack_bonus: int = int(body.get("attack_bonus", default_attack_bonus))
    damage_bonus: int = int(body.get("damage_bonus", default_damage_bonus))

    avg_die = (die_size + 1) / 2
    avg_damage_per_hit = num_dice * avg_die + damage_bonus

    dpr_by_ac: list[dict[str, Any]] = []
    for target_ac in range(10, 26):
        hit_chance = max(
            MIN_HIT_CHANCE,
            min(MAX_HIT_CHANCE, (HIT_FORMULA_BASE + attack_bonus - target_ac) / 20),
        )
        dpr = num_attacks * hit_chance * avg_damage_per_hit
        dpr_by_ac.append({
            "target_ac": target_ac,
            "hit_chance": round(hit_chance, 3),
            "dpr": round(dpr, 2),
        })

    _log.info(
        "Simulated %s (id=%s): %dd%d+%d x%d attacks",
        char.name, char.id, num_dice, die_size, damage_bonus, num_attacks,
    )

    return {
        "character_id": character_id,
        "character_name": char.name,
        "attack_bonus": attack_bonus,
        "damage_formula": f"{num_dice}d{die_size}+{damage_bonus}",
        "num_attacks": num_attacks,
        "dpr_by_ac": dpr_by_ac,
    }
