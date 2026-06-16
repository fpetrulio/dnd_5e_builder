from __future__ import annotations

import math
from typing import Any

from .tables import (
    ABILITIES,
    ARMOR_TABLE,
    FULL_CASTER_SLOTS,
    HIT_DICE,
    PACT_MAGIC_SLOTS,
    SAVING_THROWS,
    SKILL_ABILITY,
    SPELLCASTING_ABILITY,
    SPELLCASTING_TYPE,
)


def ability_modifier(score: int) -> int:
    return math.floor((score - 10) / 2)


def proficiency_bonus(total_level: int) -> int:
    return 2 + (total_level - 1) // 4


def _resolve_classes(state: dict[str, Any]) -> list[dict[str, Any]]:
    classes = state.get("classes", [])
    if not classes and state.get("current_level", 1) > 0:
        # Legacy / simplified state: single class stored flat
        class_id = state.get("class_id", "fighter")
        level = state.get("current_level", 1)
        classes = [{"class_id": class_id, "level": level}]
    return classes


def _compute_hp(classes: list[dict[str, Any]], hp_rolls: list[int], con_mod: int) -> int:
    if not classes:
        return max(1, 1 + con_mod)

    primary = classes[0].get("class_id", "fighter")
    hit_die = HIT_DICE.get(primary, 8)
    total_levels = sum(c.get("level", 0) for c in classes)

    # Level 1: max hit die + CON
    hp = hit_die + con_mod

    # Higher levels: use stored rolls if available, else use average
    avg_roll = math.ceil(hit_die / 2) + 1
    for i in range(1, total_levels):
        roll = hp_rolls[i - 1] if i - 1 < len(hp_rolls) else avg_roll
        hp += max(1, roll + con_mod)

    return max(1, hp)


def _compute_ac(state: dict[str, Any], mods: dict[str, int]) -> int:
    armor_id = state.get("armor_id") or state.get("armor")
    shield = bool(state.get("shield_equipped") or state.get("shield"))
    dex_mod = mods.get("dex", 0)
    classes = _resolve_classes(state)
    class_ids = {c.get("class_id", "") for c in classes}

    if armor_id and armor_id in ARMOR_TABLE:
        base_ac, armor_type = ARMOR_TABLE[armor_id]
        if armor_type == "light":
            ac = base_ac + dex_mod
        elif armor_type == "medium":
            ac = base_ac + min(dex_mod, 2)
        else:
            ac = base_ac
    else:
        if "monk" in class_ids and not shield:
            ac = 10 + dex_mod + mods.get("wis", 0)
        elif "barbarian" in class_ids:
            ac = 10 + dex_mod + mods.get("con", 0)
        else:
            ac = 10 + dex_mod

    return ac + (2 if shield else 0)


def _compute_spell_slots(classes: list[dict[str, Any]]) -> dict[str, int]:
    effective_level = 0
    pact: dict[str, int] | None = None

    for c in classes:
        cid = c.get("class_id", "")
        lvl = c.get("level", 0)
        stype = SPELLCASTING_TYPE.get(cid)

        if stype == "full":
            effective_level += lvl
        elif stype == "half":
            effective_level += lvl // 2
        elif stype == "artificer":
            effective_level += math.ceil(lvl / 2)
        elif stype == "third":
            effective_level += lvl // 3
        elif stype == "pact":
            pact = PACT_MAGIC_SLOTS.get(lvl)

    slots: dict[str, int] = {}
    if effective_level > 0:
        raw = FULL_CASTER_SLOTS.get(min(effective_level, 20), {})
        slots = {str(k): v for k, v in raw.items()}

    if pact:
        slots[f"pact_{pact['level']}"] = pact["slots"]

    return slots


def compute_stats(state: dict[str, Any]) -> dict[str, Any]:
    scores = state.get("ability_scores", {})
    # Ensure all abilities present (default 10)
    for ab in ABILITIES:
        scores.setdefault(ab, 10)

    classes = _resolve_classes(state)
    total_level = sum(c.get("level", 0) for c in classes) or state.get("current_level", 1)
    prof = proficiency_bonus(total_level)
    mods = {ab: ability_modifier(scores[ab]) for ab in ABILITIES}

    hp_max = _compute_hp(classes, state.get("hp_rolls", []), mods["con"])
    ac = _compute_ac(state, mods)

    # Saving throws
    prof_saves: set[str] = set()
    for c in classes:
        prof_saves.update(SAVING_THROWS.get(c.get("class_id", ""), []))
    saving_throws = {
        ab: mods[ab] + (prof if ab in prof_saves else 0) for ab in ABILITIES
    }

    # Skills
    skill_profs = set(state.get("skill_proficiencies", []))
    expertise = set(state.get("skill_expertise", []))
    skills = {}
    for skill, ability in SKILL_ABILITY.items():
        base = mods.get(ability, 0)
        if skill in expertise:
            skills[skill] = base + prof * 2
        elif skill in skill_profs:
            skills[skill] = base + prof
        else:
            skills[skill] = base

    # Spellcasting
    spell_dc: int | None = None
    spell_attack: int | None = None
    for c in classes:
        cid = c.get("class_id", "")
        sp_ab = SPELLCASTING_ABILITY.get(cid)
        if sp_ab:
            spell_dc = 8 + prof + mods[sp_ab]
            spell_attack = prof + mods[sp_ab]
            break

    # Race speed (simplified — full impl reads race data)
    speed = state.get("speed", 30)

    return {
        "total_level": total_level,
        "proficiency_bonus": prof,
        "ability_modifiers": mods,
        "hp_max": hp_max,
        "armor_class": ac,
        "initiative": mods["dex"],
        "speed": speed,
        "saving_throws": saving_throws,
        "skills": skills,
        "passive_perception": 10 + skills.get("perception", mods["wis"]),
        "spell_slots": _compute_spell_slots(classes),
        "spell_save_dc": spell_dc,
        "spell_attack_bonus": spell_attack,
    }
