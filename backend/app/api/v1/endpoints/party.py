from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.character import Character
from app.models.party import Party, PartyMember
from app.services.rules_engine import compute_stats

router = APIRouter()

# Role classification by class
ROLE_MAP: dict[str, list[str]] = {
    "frontline":   ["barbarian", "fighter", "paladin", "monk"],
    "spellcaster": ["wizard", "sorcerer", "warlock", "bard", "druid", "cleric", "artificer"],
    "healer":      ["cleric", "druid", "paladin", "bard"],
    "striker":     ["rogue", "ranger", "monk", "fighter"],
    "controller":  ["wizard", "druid", "sorcerer", "artificer", "warlock"],
    "support":     ["cleric", "bard", "druid", "artificer"],
}


async def _get_party_or_404(party_id: str, db: AsyncSession) -> Party:
    party = await db.get(Party, party_id)
    if not party:
        raise HTTPException(404, "Party not found")
    return party


async def _build_party_response(party: Party, db: AsyncSession) -> dict[str, Any]:
    """Build a rich party response loading each member's character data."""
    members: list[dict[str, Any]] = []
    roles_covered: set[str] = set()

    for m in party.members:
        char = await db.get(Character, m.character_id)
        if char is None:
            continue
        state = char.state
        computed = compute_stats(state)
        classes = state.get("classes", [])
        primary_class = classes[0].get("class_id", "") if classes else ""

        for role, class_list in ROLE_MAP.items():
            if primary_class in class_list:
                roles_covered.add(role)

        members.append({
            "character_id": char.id,
            "name": char.name,
            "class_id": primary_class,
            "level": computed["total_level"],
            "hp": computed["hp_max"],
            "ac": computed["armor_class"],
            "race_id": state.get("race_id", ""),
            "background_id": state.get("background_id", ""),
        })

    all_roles = list(ROLE_MAP.keys())
    role_coverage = {r: r in roles_covered for r in all_roles}

    return {
        "id": party.id,
        "name": party.name,
        "members": members,
        "role_coverage": role_coverage,
    }


@router.get("/")
async def list_parties(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    result = await db.execute(select(Party))
    parties = result.scalars().all()
    return [{"id": p.id, "name": p.name, "member_count": len(p.members)} for p in parties]


@router.post("/", status_code=201)
async def create_party(body: dict[str, Any], db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    name = str(body.get("name", "")).strip()
    if not name:
        raise HTTPException(400, "Party name is required")
    party = Party(id=str(uuid.uuid4()), name=name)
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return await _build_party_response(party, db)


@router.get("/{party_id}")
async def get_party(party_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    party = await _get_party_or_404(party_id, db)
    return await _build_party_response(party, db)


@router.delete("/{party_id}", status_code=204)
async def delete_party(party_id: str, db: AsyncSession = Depends(get_db)) -> None:
    party = await _get_party_or_404(party_id, db)
    await db.delete(party)
    await db.commit()


@router.post("/{party_id}/members", status_code=201)
async def add_member(
    party_id: str, body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    party = await _get_party_or_404(party_id, db)
    character_id = str(body.get("character_id", ""))

    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")

    existing = await db.execute(
        select(PartyMember).where(
            PartyMember.party_id == party_id,
            PartyMember.character_id == character_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(409, "Character is already in this party")

    member = PartyMember(party_id=party_id, character_id=character_id)
    db.add(member)
    await db.commit()
    await db.refresh(party)
    return await _build_party_response(party, db)


@router.delete("/{party_id}/members/{character_id}", status_code=204)
async def remove_member(
    party_id: str, character_id: str, db: AsyncSession = Depends(get_db)
) -> None:
    result = await db.execute(
        select(PartyMember).where(
            PartyMember.party_id == party_id,
            PartyMember.character_id == character_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Member not found in party")
    await db.delete(member)
    await db.commit()
