"""D&D 5e SRD data tables used by the rules engine."""

from __future__ import annotations

HIT_DICE: dict[str, int] = {
    "barbarian": 12,
    "fighter": 10,
    "paladin": 10,
    "ranger": 10,
    "artificer": 8,
    "bard": 8,
    "cleric": 8,
    "druid": 8,
    "monk": 8,
    "rogue": 8,
    "warlock": 8,
    "wizard": 6,
    "sorcerer": 6,
}

SAVING_THROWS: dict[str, list[str]] = {
    "artificer": ["con", "int"],
    "barbarian": ["str", "con"],
    "bard": ["dex", "cha"],
    "cleric": ["wis", "cha"],
    "druid": ["int", "wis"],
    "fighter": ["str", "con"],
    "monk": ["str", "dex"],
    "paladin": ["wis", "cha"],
    "ranger": ["str", "dex"],
    "rogue": ["dex", "int"],
    "sorcerer": ["con", "cha"],
    "warlock": ["wis", "cha"],
    "wizard": ["int", "wis"],
}

SKILL_ABILITY: dict[str, str] = {
    "acrobatics": "dex",
    "animal_handling": "wis",
    "arcana": "int",
    "athletics": "str",
    "deception": "cha",
    "history": "int",
    "insight": "wis",
    "intimidation": "cha",
    "investigation": "int",
    "medicine": "wis",
    "nature": "int",
    "perception": "wis",
    "performance": "cha",
    "persuasion": "cha",
    "religion": "int",
    "sleight_of_hand": "dex",
    "stealth": "dex",
    "survival": "wis",
}

# (base_ac, type) — type: light | medium | heavy
ARMOR_TABLE: dict[str, tuple[int, str]] = {
    "padded": (11, "light"),
    "leather": (11, "light"),
    "studded-leather": (12, "light"),
    "hide": (12, "medium"),
    "chain-shirt": (13, "medium"),
    "scale-mail": (14, "medium"),
    "breastplate": (14, "medium"),
    "half-plate": (15, "medium"),
    "ring-mail": (14, "heavy"),
    "chain-mail": (16, "heavy"),
    "splint": (17, "heavy"),
    "plate": (18, "heavy"),
}

SPELLCASTING_TYPE: dict[str, str | None] = {
    "bard": "full",
    "cleric": "full",
    "druid": "full",
    "sorcerer": "full",
    "wizard": "full",
    "artificer": "artificer",  # half, but rounds up
    "paladin": "half",
    "ranger": "half",
    "warlock": "pact",
    "barbarian": None,
    "fighter": None,
    "monk": None,
    "rogue": None,
}

SPELLCASTING_ABILITY: dict[str, str] = {
    "bard": "cha",
    "cleric": "wis",
    "druid": "wis",
    "sorcerer": "cha",
    "wizard": "int",
    "artificer": "int",
    "paladin": "cha",
    "ranger": "wis",
    "warlock": "cha",
}

# Full caster spell slots: class_level → {slot_level: count}
FULL_CASTER_SLOTS: dict[int, dict[int, int]] = {
    1:  {1: 2},
    2:  {1: 3},
    3:  {1: 4, 2: 2},
    4:  {1: 4, 2: 3},
    5:  {1: 4, 2: 3, 3: 2},
    6:  {1: 4, 2: 3, 3: 3},
    7:  {1: 4, 2: 3, 3: 3, 4: 1},
    8:  {1: 4, 2: 3, 3: 3, 4: 2},
    9:  {1: 4, 2: 3, 3: 3, 4: 3, 5: 1},
    10: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2},
    11: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1},
    12: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1},
    13: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1},
    14: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1},
    15: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1},
    16: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1},
    17: {1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1},
    18: {1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1},
    19: {1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1},
    20: {1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1},
}

# Pact magic: warlock_level → {slots, level}
PACT_MAGIC_SLOTS: dict[int, dict[str, int]] = {
    1:  {"slots": 1, "level": 1},
    2:  {"slots": 2, "level": 1},
    3:  {"slots": 2, "level": 2},
    4:  {"slots": 2, "level": 2},
    5:  {"slots": 2, "level": 3},
    6:  {"slots": 2, "level": 3},
    7:  {"slots": 2, "level": 4},
    8:  {"slots": 2, "level": 4},
    9:  {"slots": 2, "level": 5},
    10: {"slots": 2, "level": 5},
    11: {"slots": 3, "level": 5},
    12: {"slots": 3, "level": 5},
    13: {"slots": 3, "level": 5},
    14: {"slots": 3, "level": 5},
    15: {"slots": 3, "level": 5},
    16: {"slots": 3, "level": 5},
    17: {"slots": 4, "level": 5},
    18: {"slots": 4, "level": 5},
    19: {"slots": 4, "level": 5},
    20: {"slots": 4, "level": 5},
}

ABILITIES: list[str] = ["str", "dex", "con", "int", "wis", "cha"]

# Standard Array values
STANDARD_ARRAY: list[int] = [15, 14, 13, 12, 10, 8]

# Point Buy costs (score → points)
POINT_BUY_COST: dict[int, int] = {8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}
POINT_BUY_BUDGET = 27
