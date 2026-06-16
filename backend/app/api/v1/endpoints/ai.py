import json
from typing import Any

import anthropic
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter()


def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured")
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


@router.post("/advise")
async def advise_build(body: dict[str, Any]) -> dict[str, Any]:
    client = _get_client()
    character_json = body.get("character_state", {})
    goal = body.get("goal", "optimize the build balancing DPS and survivability")

    prompt = f"""You are an expert D&D 5e build optimizer.
Analyze this character and suggest improvements to achieve the specified goal.

Character (JSON):
{character_json}

Goal: {goal}

Respond in JSON with this schema:
{{
  "analysis": "brief analysis of the current build",
  "strengths": ["strength 1", ...],
  "weaknesses": ["weakness 1", ...],
  "suggestions": [
    {{
      "priority": "high|medium|low",
      "category": "feat|spell|subclass|multiclass|equipment",
      "suggestion": "description",
      "reasoning": "why this improves the build"
    }}
  ],
  "alternative_builds": [
    {{
      "name": "alternative build name",
      "description": "description",
      "trade_offs": "what you gain and what you lose"
    }}
  ]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        content = message.content[0].text
        start = content.find("{")
        end = content.rfind("}") + 1
        result: dict[str, Any] = json.loads(content[start:end])
    except Exception:
        result = {"raw": message.content[0].text}

    return result


@router.post("/compare")
async def compare_builds(body: dict[str, Any]) -> dict[str, Any]:
    client = _get_client()
    builds = body.get("builds", [])

    prompt = f"""You are a D&D 5e expert. Compare these builds and produce a comparative analysis.

Builds to compare:
{builds}

Respond in JSON with:
{{
  "summary": "comparison summary",
  "comparison": {{
    "dpr": {{}},
    "survivability": {{}},
    "utility": {{}},
    "complexity": {{}}
  }},
  "winner_by_category": {{}},
  "recommendation": "which build to choose and in what context"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        content = message.content[0].text
        start = content.find("{")
        end = content.rfind("}") + 1
        result: dict[str, Any] = json.loads(content[start:end])
    except Exception:
        result = {"raw": message.content[0].text}

    return result
