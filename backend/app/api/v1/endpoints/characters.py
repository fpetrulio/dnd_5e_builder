from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.character import Character, CharacterSnapshot
from app.schemas.character import CharacterCreate, CharacterResponse, CharacterUpdate
from app.services.rules_engine import compute_stats

router = APIRouter()


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
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    return _build_response(char)


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: str, body: CharacterUpdate, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    if body.name is not None:
        char.name = body.name
    if body.state is not None:
        char.state = body.state
    await db.commit()
    return _build_response(char)


@router.delete("/{character_id}", status_code=204)
async def delete_character(character_id: str, db: AsyncSession = Depends(get_db)) -> None:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    await db.delete(char)
    await db.commit()


@router.get("/{character_id}/stats")
async def get_character_stats(
    character_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    return compute_stats(char.state)


@router.get("/{character_id}/snapshot/{level}")
async def get_snapshot(
    character_id: str, level: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    result = await db.execute(
        select(CharacterSnapshot).where(
            CharacterSnapshot.character_id == character_id,
            CharacterSnapshot.level == level,
        )
    )
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(404, f"Snapshot at level {level} not found")
    return {"character_id": character_id, "level": level, "state": snap.state}


@router.post("/{character_id}/level-up")
async def level_up(
    character_id: str, body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    state = char.state
    current_level = state.get("current_level", 1)

    snap = CharacterSnapshot(
        character_id=character_id,
        level=current_level,
        state_json=char.state_json,
    )
    db.add(snap)

    state["current_level"] = current_level + 1
    state["level_up_choices"] = [*state.get("level_up_choices", []), body]
    char.state = state
    await db.commit()
    return {"current_level": state["current_level"], "state": state}


@router.post("/{character_id}/revert/{level}")
async def revert_to_level(
    character_id: str, level: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    result = await db.execute(
        select(CharacterSnapshot).where(
            CharacterSnapshot.character_id == character_id,
            CharacterSnapshot.level == level,
        )
    )
    snap = result.scalar_one_or_none()
    if not snap:
        raise HTTPException(404, f"Snapshot at level {level} not found")
    char.state = snap.state
    await db.commit()
    return {"current_level": level, "state": char.state}
