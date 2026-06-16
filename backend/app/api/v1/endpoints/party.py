import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.party import Party

router = APIRouter()


@router.get("/")
async def list_parties(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    result = await db.execute(select(Party))
    return [{"id": p.id, "name": p.name} for p in result.scalars().all()]


@router.post("/", status_code=201)
async def create_party(body: dict[str, Any], db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    party = Party(id=str(uuid.uuid4()), name=body["name"])
    db.add(party)
    await db.commit()
    return {"id": party.id, "name": party.name}


@router.get("/{party_id}")
async def get_party(party_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    party = await db.get(Party, party_id)
    if not party:
        raise HTTPException(404, "Party not found")
    return {"id": party.id, "name": party.name, "members": [m.character_id for m in party.members]}


@router.get("/{party_id}/optimize")
async def optimize_party(party_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    # Placeholder — AI/optimizer integration goes here
    return {"party_id": party_id, "suggestions": [], "analysis": {}}
