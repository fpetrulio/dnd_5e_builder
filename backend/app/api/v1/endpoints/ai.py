from __future__ import annotations

import json
from typing import Any

import anthropic
from anthropic.types import TextBlock
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.character import Character

router = APIRouter()


def _extract_text(message: anthropic.types.Message) -> str:
    block = message.content[0] if message.content else None
    return block.text if isinstance(block, TextBlock) else ""


def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured")
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _parse_json_response(text: str) -> dict[str, Any]:
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        result: dict[str, Any] = json.loads(text[start:end])
        return result
    except Exception:
        return {"raw": text}


async def _load_character(character_id: str, db: AsyncSession) -> Character:
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, f"Character '{character_id}' not found")
    return char


@router.post("/advise")
async def advise_build(
    body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    character_id = str(body.get("character_id", ""))
    goal = str(body.get("goal", "optimize the build balancing DPS and survivability"))

    char = await _load_character(character_id, db)
    client = _get_client()

    prompt = f"""You are an expert D&D 5e build optimizer.
Analyze this character and suggest improvements to achieve the specified goal.

Character (JSON):
{json.dumps(char.state, indent=2)}

Character name: {char.name}
Goal: {goal}

Respond ONLY with valid JSON, no markdown fences, matching this schema exactly:
{{
  "analysis": "2-3 sentence analysis of the current build",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": [
    {{
      "priority": "high",
      "category": "feat",
      "suggestion": "Take the War Caster feat",
      "reasoning": "Allows concentration in melee"
    }}
  ],
  "alternative_builds": [
    {{
      "name": "Alternative build name",
      "description": "What it does differently",
      "trade_offs": "What you gain vs. what you lose"
    }}
  ]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(_extract_text(message))


@router.post("/compare")
async def compare_builds(
    body: dict[str, Any], db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    character_ids: list[str] = [str(cid) for cid in body.get("character_ids", [])]
    if len(character_ids) < 2:
        raise HTTPException(400, "Provide at least 2 character_ids to compare")

    chars = [await _load_character(cid, db) for cid in character_ids]
    client = _get_client()

    builds_json = json.dumps(
        [{"name": c.name, "state": c.state} for c in chars], indent=2
    )

    prompt = f"""You are a D&D 5e expert. Compare these character builds.

Builds:
{builds_json}

Respond ONLY with valid JSON, no markdown fences, matching this schema exactly:
{{
  "summary": "1-2 sentence overall comparison",
  "comparison": {{
    "dpr": {{"winner": "name", "reasoning": "why"}},
    "survivability": {{"winner": "name", "reasoning": "why"}},
    "utility": {{"winner": "name", "reasoning": "why"}},
    "complexity": {{"winner": "name", "reasoning": "which is easier to play"}}
  }},
  "recommendation": "Which build to choose and in what context"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(_extract_text(message))
