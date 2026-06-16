from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ClassEntry(BaseModel):
    class_id: str
    level: int = Field(ge=1, le=20)
    subclass_id: str | None = None


class CharacterStateIn(BaseModel):
    race_id: str = ""
    subrace_id: str | None = None
    background_id: str = ""
    alignment: str = ""
    classes: list[ClassEntry] = Field(default_factory=list)
    ability_scores: dict[str, int] = Field(
        default_factory=lambda: {
            "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10,
        }
    )
    skill_proficiencies: list[str] = Field(default_factory=list)
    skill_expertise: list[str] = Field(default_factory=list)
    tool_proficiencies: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    hp_rolls: list[int] = Field(default_factory=list)
    armor_id: str | None = None
    shield_equipped: bool = False
    spells_known: list[str] = Field(default_factory=list)
    cantrips_known: list[str] = Field(default_factory=list)
    feats: list[str] = Field(default_factory=list)
    current_level: int = 1
    xp: int = 0
    notes: str = ""
    inspiration: bool = False


class CharacterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    state: CharacterStateIn = Field(default_factory=CharacterStateIn)


class CharacterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    state: dict[str, Any] | None = None


class ComputedStatsOut(BaseModel):
    total_level: int
    proficiency_bonus: int
    ability_modifiers: dict[str, int]
    hp_max: int
    armor_class: int
    initiative: int
    speed: int
    saving_throws: dict[str, int]
    skills: dict[str, int]
    passive_perception: int
    spell_slots: dict[str, int]
    spell_save_dc: int | None = None
    spell_attack_bonus: int | None = None


class CharacterResponse(BaseModel):
    id: str
    name: str
    state: dict[str, Any]
    computed: ComputedStatsOut
    created_at: str


class ASIChoiceIn(BaseModel):
    method: str  # "single" | "split" | "feat" | "none"
    ability_single: str | None = None
    ability_a: str | None = None
    ability_b: str | None = None
    feat_name: str | None = None


class LevelUpChoicesIn(BaseModel):
    hp_method: str = "average"  # "average" | "roll" | "manual"
    hp_value: int | None = None
    subclass_id: str | None = None
    asi_choice: ASIChoiceIn | None = None
    new_skill_proficiencies: list[str] = Field(default_factory=list)


class SnapshotOut(BaseModel):
    id: int
    level: int
    created_at: str
