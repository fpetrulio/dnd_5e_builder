from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.homebrew import HomebrewResource

router = APIRouter()
_log = logging.getLogger("app.homebrew")


@router.get("/")
async def list_homebrew(
    resource_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    q = select(HomebrewResource).order_by(HomebrewResource.created_at.desc())
    if resource_type:
        q = q.where(HomebrewResource.resource_type == resource_type)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "type": r.resource_type,
            "name": r.name,
            "source": r.source_label,
            "data": json.loads(r.data_json) if r.data_json else {},
            "created_at": str(r.created_at),
        }
        for r in rows
    ]


@router.post("/", status_code=201)
async def create_homebrew(
    body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    resource_type = str(body.get("type", "")).strip()
    name = str(body.get("name", "")).strip()
    if not resource_type or not name:
        raise HTTPException(400, "Both 'type' and 'name' are required")

    resource = HomebrewResource(
        id=str(uuid.uuid4()),
        resource_type=resource_type,
        name=name,
        source_label=str(body.get("source_label", "Homebrew")),
        data_json=json.dumps(body.get("data", {})),
    )
    db.add(resource)
    await db.commit()
    _log.info("Created homebrew resource '%s' (type=%s id=%s)", name, resource_type, resource.id)
    return {"id": resource.id, "name": resource.name, "type": resource.resource_type}


@router.delete("/{resource_id}", status_code=204)
async def delete_homebrew(resource_id: str, db: AsyncSession = Depends(get_db)) -> None:
    resource = await db.get(HomebrewResource, resource_id)
    if not resource:
        raise HTTPException(404, "Resource not found")
    _log.info("Deleted homebrew resource '%s' (id=%s)", resource.name, resource_id)
    await db.delete(resource)
    await db.commit()
