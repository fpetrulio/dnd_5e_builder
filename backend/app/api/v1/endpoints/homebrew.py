import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.homebrew import HomebrewResource

router = APIRouter()


@router.get("/")
async def list_homebrew(
    resource_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    q = select(HomebrewResource)
    if resource_type:
        q = q.where(HomebrewResource.resource_type == resource_type)
    result = await db.execute(q)
    return [
        {"id": r.id, "type": r.resource_type, "name": r.name, "source": r.source_label}
        for r in result.scalars().all()
    ]


@router.post("/", status_code=201)
async def create_homebrew(
    body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    resource = HomebrewResource(
        id=str(uuid.uuid4()),
        resource_type=body["type"],
        name=body["name"],
        source_label=body.get("source_label", "Homebrew"),
        data_json=str(body.get("data", {})),
    )
    db.add(resource)
    await db.commit()
    return {"id": resource.id, "name": resource.name}


@router.delete("/{resource_id}", status_code=204)
async def delete_homebrew(resource_id: str, db: AsyncSession = Depends(get_db)) -> None:
    resource = await db.get(HomebrewResource, resource_id)
    if not resource:
        raise HTTPException(404, "Resource not found")
    await db.delete(resource)
    await db.commit()
