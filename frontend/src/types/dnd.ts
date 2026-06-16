// ─── Core Types ──────────────────────────────────────────────────────────────

export type AbilityScore = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityScores = Record<AbilityScore, number>

export type DiceExpression = {
  count: number
  die: number   // d4=4, d6=6, d8=8, d10=10, d12=12, d20=20
  bonus?: number
}

export type Size = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'

export type Alignment =
  | 'lawful_good' | 'neutral_good' | 'chaotic_good'
  | 'lawful_neutral' | 'true_neutral' | 'chaotic_neutral'
  | 'lawful_evil' | 'neutral_evil' | 'chaotic_evil'
  | 'unaligned'

// ─── Resources ───────────────────────────────────────────────────────────────

export interface DndClass {
  id: string
  name: string
  hit_die: number
  primary_ability: AbilityScore[]
  saving_throws: AbilityScore[]
  spellcasting_ability?: AbilityScore
  is_spellcaster: boolean
  spellcasting_type?: 'full' | 'half' | 'third' | 'pact' | 'none'
  subclass_level: number
  source: string
}

export interface DndSubclass {
  id: string
  name: string
  class_id: string
  source: string
}

export interface DndRace {
  id: string
  name: string
  size: Size
  speed: number
  ability_bonuses: Partial<AbilityScores>
  subraces?: DndSubrace[]
  source: string
}

export interface DndSubrace {
  id: string
  name: string
  race_id: string
  ability_bonuses: Partial<AbilityScores>
  source: string
}

export interface DndBackground {
  id: string
  name: string
  skill_proficiencies: string[]
  tool_proficiencies: string[]
  languages: number
  source: string
}

export interface DndFeat {
  id: string
  name: string
  prerequisites?: string
  description: string
  ability_score_increase?: Partial<AbilityScores>
  source: string
}

export interface DndSpell {
  id: string
  name: string
  level: number  // 0 = cantrip
  school: string
  casting_time: string
  range: string
  components: string[]
  duration: string
  concentration: boolean
  ritual: boolean
  classes: string[]
  description: string
  source: string
}

// ─── Character ───────────────────────────────────────────────────────────────

export interface ClassLevel {
  class_id: string
  level: number
  subclass_id?: string
}

export interface Character {
  id: string
  name: string
  race_id: string
  subrace_id?: string
  background_id: string
  alignment: Alignment
  ability_scores: AbilityScores
  classes: ClassLevel[]   // multiclass support
  current_level: number   // sum of all class levels
  created_at: string
  updated_at: string
}

export interface CharacterSnapshot {
  character_id: string
  level: number
  state: CharacterState
  created_at: string
}

export interface CharacterState {
  character: Character
  computed: ComputedStats
  spell_slots: SpellSlotTable
  features: AcquiredFeature[]
  spells_known: string[]    // spell ids
  equipment: EquipmentItem[]
}

// ─── Computed Stats ───────────────────────────────────────────────────────────

export interface ComputedStats {
  max_hp: number
  armor_class: number
  initiative: number
  speed: number
  proficiency_bonus: number
  ability_modifiers: AbilityScores
  saving_throws: Record<AbilityScore, { bonus: number; proficient: boolean }>
  skills: Record<string, { bonus: number; proficient: boolean; expertise: boolean }>
  passive_perception: number
  attack_bonus: number
  spell_save_dc?: number
  spell_attack_bonus?: number
}

export interface SpellSlotTable {
  standard: Record<number, { total: number; used: number }>   // levels 1–9
  pact_magic?: { slots: number; level: number; used: number }
}

export interface AcquiredFeature {
  id: string
  name: string
  description: string
  source_class?: string
  source_race?: string
  level_acquired: number
  uses?: { total: number; recovery: 'short' | 'long' | 'none' }
}

export interface EquipmentItem {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'shield' | 'gear' | 'magic'
  equipped: boolean
  attuned?: boolean
}

// ─── DPR & Stats ─────────────────────────────────────────────────────────────

export interface DPRResult {
  mean: number
  max: number
  min: number
  std_dev: number
  hit_probability: number
  crit_probability: number
  breakdown: DPRBreakdown[]
}

export interface DPRBreakdown {
  source: string
  mean_damage: number
  dice: DiceExpression
  bonus: number
  attacks_per_round: number
}

export interface BuildStats {
  dpr: DPRResult
  survivability_score: number  // 0-100
  utility_score: number
  control_score: number
  support_score: number
  mobility_score: number
  hp_per_long_rest: number
  resources_per_encounter: ResourceUsage[]
}

export interface ResourceUsage {
  name: string
  uses_per_short_rest: number
  uses_per_long_rest: number
}

// ─── Party ────────────────────────────────────────────────────────────────────

export type PartyRole = 'tank' | 'healer' | 'dps' | 'controller' | 'support' | 'utility'

export interface Party {
  id: string
  name: string
  members: PartyMember[]
  created_at: string
}

export interface PartyMember {
  character_id: string
  character: Character
  assigned_roles: PartyRole[]
}

export interface PartyAnalysis {
  role_coverage: Record<PartyRole, number>  // 0–1 coverage
  total_dpr: number
  total_hp: number
  crowd_control_available: string[]
  healing_available: string[]
  synergies: Synergy[]
  gaps: string[]
}

export interface Synergy {
  source: string
  target: string
  description: string
  strength: 'minor' | 'moderate' | 'major'
}
