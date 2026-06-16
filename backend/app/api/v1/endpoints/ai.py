from typing import Any

import anthropic
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter()


def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY non configurata")
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


@router.post("/advise")
async def advise_build(body: dict[str, Any]) -> dict[str, Any]:
    client = _get_client()
    character_json = body.get("character_state", {})
    goal = body.get("goal", "ottimizza la build bilanciando DPS e survivability")

    prompt = f"""Sei un esperto ottimizzatore di build per D&D 5e.
Analizza questo personaggio e suggerisci miglioramenti per raggiungere l'obiettivo specificato.

Personaggio (JSON):
{character_json}

Obiettivo: {goal}

Rispondi in JSON con questo schema:
{{
  "analysis": "breve analisi della build attuale",
  "strengths": ["punto di forza 1", ...],
  "weaknesses": ["debolezza 1", ...],
  "suggestions": [
    {{
      "priority": "alta|media|bassa",
      "category": "feat|spell|subclass|multiclass|equipment",
      "suggestion": "descrizione",
      "reasoning": "spiegazione del perché"
    }}
  ],
  "alternative_builds": [
    {{
      "name": "nome build alternativa",
      "description": "descrizione",
      "trade_offs": "cosa si guadagna e cosa si perde"
    }}
  ]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    import json

    try:
        content = message.content[0].text
        start = content.find("{")
        end = content.rfind("}") + 1
        result = json.loads(content[start:end])
    except Exception:
        result = {"raw": message.content[0].text}

    return result


@router.post("/compare")
async def compare_builds(body: dict[str, Any]) -> dict[str, Any]:
    client = _get_client()
    builds = body.get("builds", [])

    prompt = f"""Sei un esperto di D&D 5e. Confronta queste build e produci un'analisi comparativa.

Build da confrontare:
{builds}

Rispondi in JSON con:
{{
  "summary": "sommario del confronto",
  "comparison": {{
    "dpr": {{}},
    "survivability": {{}},
    "utility": {{}},
    "complexity": {{}}
  }},
  "winner_by_category": {{}},
  "recommendation": "quale build scegliere e in quale contesto"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    import json

    try:
        content = message.content[0].text
        start = content.find("{")
        end = content.rfind("}") + 1
        result = json.loads(content[start:end])
    except Exception:
        result = {"raw": message.content[0].text}

    return result
