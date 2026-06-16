"""Unit tests for the rules engine — no database required."""

from __future__ import annotations

from app.services.rules_engine import compute_stats


def _base_state(**overrides: object) -> dict[str, object]:
    state: dict[str, object] = {
        "classes": [{"class_id": "fighter", "level": 1}],
        "ability_scores": {
            "str": 16, "dex": 14, "con": 14, "int": 10, "wis": 12, "cha": 8,
        },
        "skill_proficiencies": [],
        "skill_expertise": [],
        "hp_rolls": [],
        "armor_id": None,
        "shield_equipped": False,
        "spells_known": [],
        "cantrips_known": [],
        "feats": [],
        "current_level": 1,
    }
    state.update(overrides)
    return state


# ─── Basic fighter ────────────────────────────────────────────────────────────

def test_fighter_level1_totals() -> None:
    s = compute_stats(_base_state())
    assert s["total_level"] == 1
    assert s["proficiency_bonus"] == 2
    assert s["initiative"] == 2          # DEX mod
    assert s["speed"] == 30
    assert s["passive_perception"] == 11  # 10 + WIS mod (1)


def test_fighter_level1_hp_max_die_plus_con() -> None:
    # Level 1: always max die (10) + CON mod
    s = compute_stats(_base_state())
    assert s["hp_max"] == 12  # 10 + 2


def test_fighter_level1_unarmored_ac() -> None:
    s = compute_stats(_base_state())
    assert s["armor_class"] == 12  # 10 + DEX mod (2)


def test_ability_modifiers() -> None:
    s = compute_stats(_base_state())
    assert s["ability_modifiers"]["str"] == 3   # (16-10)//2
    assert s["ability_modifiers"]["dex"] == 2   # (14-10)//2
    assert s["ability_modifiers"]["con"] == 2
    assert s["ability_modifiers"]["int"] == 0
    assert s["ability_modifiers"]["wis"] == 1
    assert s["ability_modifiers"]["cha"] == -1


def test_skill_proficiency_bonus() -> None:
    s = compute_stats(_base_state(skill_proficiencies=["athletics", "intimidation"]))
    assert s["skills"]["athletics"] == 5    # STR mod (3) + prof (2)
    assert s["skills"]["intimidation"] == 1  # CHA mod (-1) + prof (2)
    assert s["skills"]["acrobatics"] == 2   # DEX mod (2), no prof


# ─── HP progression ───────────────────────────────────────────────────────────

def test_hp_multilevels_with_rolls() -> None:
    # Fighter level 3, CON 16 (mod +3), rolls [8, 6] for levels 2 and 3
    state = _base_state(
        classes=[{"class_id": "fighter", "level": 3}],
        ability_scores={"str": 16, "dex": 12, "con": 16, "int": 10, "wis": 12, "cha": 8},
        hp_rolls=[8, 6],
        current_level=3,
    )
    s = compute_stats(state)
    # Lv1: 10 + 3 = 13, Lv2: max(1, 8+3)=11, Lv3: max(1, 6+3)=9 → total 33
    assert s["hp_max"] == 33


def test_hp_uses_average_when_no_roll() -> None:
    # Fighter level 2, CON 10 (mod 0), no rolls provided → average used
    import math
    state = _base_state(
        classes=[{"class_id": "fighter", "level": 2}],
        ability_scores={"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10},
        hp_rolls=[],
        current_level=2,
    )
    s = compute_stats(state)
    avg = math.ceil(10 / 2) + 1  # 6 for a d10
    assert s["hp_max"] == 10 + avg  # Lv1 max + avg for Lv2


# ─── Spell slots ──────────────────────────────────────────────────────────────

def test_wizard_level5_spell_slots() -> None:
    state = _base_state(
        classes=[{"class_id": "wizard", "level": 5}],
        ability_scores={"str": 8, "dex": 14, "con": 14, "int": 18, "wis": 12, "cha": 10},
        hp_rolls=[4, 4, 4, 4],
        current_level=5,
    )
    s = compute_stats(state)
    assert s["spell_slots"].get(1) == 4
    assert s["spell_slots"].get(2) == 3
    assert s["spell_slots"].get(3) == 2
    assert s["spell_save_dc"] == 15  # 8 + 3 (prof) + 4 (INT mod)
    assert s["spell_attack_bonus"] == 7  # 3 + 4


def test_warlock_pact_magic() -> None:
    state = _base_state(
        classes=[{"class_id": "warlock", "level": 3}],
        ability_scores={"str": 8, "dex": 14, "con": 14, "int": 10, "wis": 12, "cha": 16},
        hp_rolls=[5, 5],
        current_level=3,
    )
    s = compute_stats(state)
    # Warlock level 3: 2 pact slots at level 2
    assert s["spell_slots"].get("pact_2") == 2


# ─── Proficiency bonus by level ───────────────────────────────────────────────

def test_proficiency_bonus_progression() -> None:
    for level, expected_pb in [(1, 2), (4, 2), (5, 3), (8, 3), (9, 4), (12, 4), (13, 5), (16, 5), (17, 6), (20, 6)]:
        state = _base_state(
            classes=[{"class_id": "fighter", "level": level}],
            hp_rolls=list(range(1, level)),
            current_level=level,
        )
        s = compute_stats(state)
        assert s["proficiency_bonus"] == expected_pb, f"Level {level}: expected {expected_pb}, got {s['proficiency_bonus']}"


# ─── Saving throws ────────────────────────────────────────────────────────────

def test_fighter_saving_throw_proficiencies() -> None:
    # Fighter is proficient in STR and CON saves
    s = compute_stats(_base_state())
    str_mod = 3
    con_mod = 2
    prof = 2
    assert s["saving_throws"]["str"] == str_mod + prof
    assert s["saving_throws"]["con"] == con_mod + prof
    assert s["saving_throws"]["dex"] == 2  # DEX mod, no prof


# ─── Shield and armor ─────────────────────────────────────────────────────────

def test_shield_adds_two_to_ac() -> None:
    base = compute_stats(_base_state())["armor_class"]
    shielded = compute_stats(_base_state(shield_equipped=True))["armor_class"]
    assert shielded == base + 2


def test_chain_mail_ac() -> None:
    state = _base_state(armor_id="chain-mail")
    s = compute_stats(state)
    assert s["armor_class"] == 16  # chain mail = 16, no DEX bonus for heavy
