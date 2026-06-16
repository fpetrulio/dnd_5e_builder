import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Loader2, Dices } from 'lucide-react'
import { cn, slugToLabel, formatModifier } from '@/lib/utils'
import { useCreateCharacter } from '@/hooks/useCharacters'
import { useClasses, useRaces, useBackgrounds, useClassSkills } from '@/hooks/useResources'
import type { DndClassApi, DndRaceApi, DndSubraceApi, DndBackgroundApi } from '@/hooks/useResources'

// ─── Constants ────────────────────────────────────────────────────────────────

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}
const ABILITY_SHORT: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const
const POINT_BUY_BUDGET = 27
const MIN_SCORE = 8
const MAX_SCORE_PB = 15
const MAX_SCORE_MANUAL = 30
const DEFAULT_SCORE = 10
const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}
const MAX_LEVEL = 20

const ALIGNMENTS = [
  'lawful_good', 'neutral_good', 'chaotic_good',
  'lawful_neutral', 'true_neutral', 'chaotic_neutral',
  'lawful_evil', 'neutral_evil', 'chaotic_evil',
]

type AbilityMethod = 'standard' | 'pointbuy' | 'manual' | 'dice'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardForm {
  name: string
  race_id: string
  subrace_id: string
  class_id: string
  background_id: string
  alignment: string
  level: number
  ability_method: AbilityMethod
  // base scores (pre-racial bonus)
  base_scores: Record<string, number>
  standard_assignments: Record<string, number | null>
  dice_rolls: number[]
  dice_assignments: Record<string, number | null>
  // skills
  class_skills: string[]
}

function abilityModifier(score: number): number {
  return Math.floor((score - DEFAULT_SCORE) / 2)
}

function rollStat(): number {
  const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6))
  rolls.sort((a, b) => a - b)
  return rolls.slice(1).reduce((s, v) => s + v, 0)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CharacterWizard() {
  const navigate = useNavigate()
  const createMutation = useCreateCharacter()
  const { data: classes = [], isLoading: loadingClasses } = useClasses()
  const { data: races = [], isLoading: loadingRaces } = useRaces()
  const { data: backgrounds = [] } = useBackgrounds()
  const { data: classSkillsMap = {} } = useClassSkills()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardForm>({
    name: '',
    race_id: '',
    subrace_id: '',
    class_id: '',
    background_id: '',
    alignment: 'true_neutral',
    level: 1,
    ability_method: 'standard',
    base_scores: { str: DEFAULT_SCORE, dex: DEFAULT_SCORE, con: DEFAULT_SCORE, int: DEFAULT_SCORE, wis: DEFAULT_SCORE, cha: DEFAULT_SCORE },
    standard_assignments: Object.fromEntries(ABILITIES.map((a) => [a, null])),
    dice_rolls: [],
    dice_assignments: Object.fromEntries(ABILITIES.map((a) => [a, null])),
    class_skills: [],
  })

  const steps = ['Identity', 'Abilities', 'Skills', 'Review']

  function patch(updates: Partial<WizardForm>) {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // ─── Derived data ──────────────────────────────────────────────────────────

  const selectedRace = races.find((r: DndRaceApi) => r.id === form.race_id)
  const subraces = selectedRace?.subraces ?? []
  const selectedSubrace = subraces.find((s: DndSubraceApi) => s.id === form.subrace_id)
  const selectedClass = classes.find((c: DndClassApi) => c.id === form.class_id)
  const selectedBackground = backgrounds.find((b: DndBackgroundApi) => b.id === form.background_id)

  // Racial bonuses: race + subrace combined
  const racialBonuses: Record<string, number> = { ...selectedRace?.ability_bonuses }
  if (selectedSubrace) {
    for (const [ab, val] of Object.entries(selectedSubrace.ability_bonuses)) {
      racialBonuses[ab] = (racialBonuses[ab] ?? 0) + val
    }
  }

  // Final scores = base + racial
  function finalScores(): Record<string, number> {
    const base = baseScores()
    return Object.fromEntries(
      ABILITIES.map((ab) => [ab, (base[ab] ?? DEFAULT_SCORE) + (racialBonuses[ab] ?? 0)])
    )
  }

  function baseScores(): Record<string, number> {
    if (form.ability_method === 'standard') {
      return Object.fromEntries(
        ABILITIES.map((ab) => [ab, form.standard_assignments[ab] ?? DEFAULT_SCORE])
      )
    }
    if (form.ability_method === 'dice') {
      return Object.fromEntries(
        ABILITIES.map((ab) => [ab, form.dice_assignments[ab] ?? DEFAULT_SCORE])
      )
    }
    return form.base_scores
  }

  // ─── Standard array ────────────────────────────────────────────────────────

  const assignedStd = Object.values(form.standard_assignments).filter((v): v is number => v !== null)
  const availableStd = STANDARD_ARRAY.filter((v) => !assignedStd.includes(v))

  function assignStd(ability: string, value: number | null) {
    const assignments = { ...form.standard_assignments, [ability]: value }
    patch({ standard_assignments: assignments })
  }

  // ─── Point buy ─────────────────────────────────────────────────────────────

  function pbSpent(): number {
    return ABILITIES.reduce((s, ab) => {
      const score = form.base_scores[ab] ?? MIN_SCORE
      return s + (POINT_BUY_COST[score] ?? 0)
    }, 0)
  }

  function canIncrement(ab: string): boolean {
    const cur = form.base_scores[ab] ?? MIN_SCORE
    if (cur >= MAX_SCORE_PB) return false
    const nextCost = POINT_BUY_COST[cur + 1] ?? POINT_BUY_BUDGET + 1
    return pbSpent() - (POINT_BUY_COST[cur] ?? 0) + nextCost <= POINT_BUY_BUDGET
  }

  function adjustPB(ab: string, delta: number) {
    const cur = form.base_scores[ab] ?? MIN_SCORE
    const next = Math.max(MIN_SCORE, Math.min(MAX_SCORE_PB, cur + delta))
    patch({ base_scores: { ...form.base_scores, [ab]: next } })
  }

  // ─── Dice rolling ──────────────────────────────────────────────────────────

  function rollAll() {
    patch({
      dice_rolls: Array.from({ length: 6 }, () => rollStat()),
      dice_assignments: Object.fromEntries(ABILITIES.map((a) => [a, null])),
    })
  }

  const assignedDice = Object.values(form.dice_assignments).filter((v): v is number => v !== null)

  function assignDice(ability: string, rollIndex: number | null) {
    // un-assign previous
    const prev = form.dice_assignments[ability]
    const newAssign = { ...form.dice_assignments }
    // if another ability had this roll index, clear it
    if (rollIndex !== null) {
      for (const [ab, idx] of Object.entries(newAssign)) {
        if (idx === rollIndex) newAssign[ab] = null
      }
    }
    newAssign[ability] = rollIndex
    // base_scores driven by dice_assignments
    const newBase = { ...form.base_scores }
    if (rollIndex !== null) {
      newBase[ability] = form.dice_rolls[rollIndex] ?? DEFAULT_SCORE
    } else if (prev !== null) {
      newBase[ability] = DEFAULT_SCORE
    }
    patch({ dice_assignments: newAssign, base_scores: newBase })
  }

  // ─── Skills ────────────────────────────────────────────────────────────────

  const classSkillOpts = form.class_id ? (classSkillsMap[form.class_id] ?? null) : null
  const bgSkills = selectedBackground?.skill_proficiencies ?? []
  const skillCount = classSkillOpts?.count ?? 2

  function toggleSkill(skill: string) {
    const cur = form.class_skills
    if (cur.includes(skill)) {
      patch({ class_skills: cur.filter((s) => s !== skill) })
    } else if (cur.length < skillCount) {
      patch({ class_skills: [...cur, skill] })
    }
  }

  // ─── Step validation ───────────────────────────────────────────────────────

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.race_id !== '' && form.class_id !== '' &&
          (subraces.length === 0 || form.subrace_id !== '')
      case 1: {
        if (form.ability_method === 'standard')
          return ABILITIES.every((ab) => form.standard_assignments[ab] !== null)
        if (form.ability_method === 'dice')
          return form.dice_rolls.length === 6 && ABILITIES.every((ab) => form.dice_assignments[ab] !== null)
        return true
      }
      case 2:
        return form.class_skills.length === skillCount
      default:
        return true
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const scores = finalScores()
    const allSkills = [...new Set([...form.class_skills, ...bgSkills])]
    await createMutation.mutateAsync({
      name: form.name.trim(),
      state: {
        race_id: form.race_id,
        subrace_id: form.subrace_id || undefined,
        background_id: form.background_id,
        alignment: form.alignment,
        classes: [{ class_id: form.class_id, level: form.level }],
        ability_scores: scores,
        skill_proficiencies: allSkills,
        current_level: form.level,
      },
    })
    void navigate('/characters')
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors', i < step ? 'text-white' : 'opacity-60')}
                style={{
                  backgroundColor: i < step ? 'var(--color-primary)' : undefined,
                  borderColor: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                  color: i === step ? 'var(--color-primary)' : undefined,
                  opacity: i <= step ? undefined : '0.4',
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="text-xs mt-1 opacity-60">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-5" style={{ backgroundColor: i < step ? 'var(--color-primary)' : 'var(--color-border)' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Identity ── */}
      {step === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Character Identity</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Character Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Enter a name..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Race</label>
            {loadingRaces ? <Spinner text="Loading races..." /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {races.map((r: DndRaceApi) => (
                  <SelectCard
                    key={r.id}
                    selected={form.race_id === r.id}
                    onClick={() => patch({ race_id: r.id, subrace_id: '' })}
                    label={r.name}
                    sub={`Speed ${r.speed}ft`}
                    badge={r.subraces && r.subraces.length > 0 ? `${r.subraces.length} subraces` : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {subraces.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Subrace</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subraces.map((s: DndSubraceApi) => {
                  const bonusStr = Object.entries(s.ability_bonuses)
                    .map(([ab, v]) => `+${v} ${ab.toUpperCase()}`)
                    .join(', ')
                  return (
                    <SelectCard
                      key={s.id}
                      selected={form.subrace_id === s.id}
                      onClick={() => patch({ subrace_id: s.id })}
                      label={s.name}
                      sub={bonusStr || undefined}
                    />
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            {loadingClasses ? <Spinner text="Loading classes..." /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classes.map((c: DndClassApi) => (
                  <SelectCard
                    key={c.id}
                    selected={form.class_id === c.id}
                    onClick={() => patch({ class_id: c.id, class_skills: [] })}
                    label={c.name}
                    sub={`d${c.hit_die} HP`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Starting Level</label>
            <input
              type="number" min={1} max={MAX_LEVEL} value={form.level}
              onChange={(e) => patch({ level: Math.min(MAX_LEVEL, Math.max(1, Number(e.target.value))) })}
              className="w-24 rounded-md border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Abilities ── */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Ability Scores</h2>

          {/* Method selector */}
          <div className="flex gap-2 flex-wrap">
            {(['standard', 'pointbuy', 'dice', 'manual'] as AbilityMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => patch({ ability_method: m })}
                className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', form.ability_method === m ? 'text-white border-transparent' : 'opacity-60')}
                style={form.ability_method === m
                  ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                  : { borderColor: 'var(--color-border)' }}
              >
                {m === 'standard' ? 'Standard Array' : m === 'pointbuy' ? 'Point Buy' : m === 'dice' ? '4d6 Drop Lowest' : 'Manual'}
              </button>
            ))}
          </div>

          {/* Racial bonus preview */}
          {Object.keys(racialBonuses).length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 py-2 rounded-md text-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <span className="opacity-50 text-xs mr-1">Racial bonuses:</span>
              {Object.entries(racialBonuses).map(([ab, v]) => (
                <span key={ab} className="font-medium" style={{ color: 'var(--color-primary)' }}>+{v} {ABILITY_SHORT[ab]}</span>
              ))}
            </div>
          )}

          {form.ability_method === 'standard' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">Assign {STANDARD_ARRAY.join(', ')} to your abilities.</p>
              <div className="flex flex-wrap gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                {availableStd.map((v) => (
                  <span key={v} className="px-2 py-1 rounded border text-sm font-mono" style={{ borderColor: 'var(--color-border)' }}>{v}</span>
                ))}
                {availableStd.length === 0 && <span className="text-sm opacity-50">All values assigned</span>}
              </div>
              <AbilityGrid>
                {ABILITIES.map((ab) => {
                  const assigned = form.standard_assignments[ab]
                  const final = (assigned ?? DEFAULT_SCORE) + (racialBonuses[ab] ?? 0)
                  return (
                    <AbilityRow key={ab} label={ABILITY_LABELS[ab]} bonus={racialBonuses[ab]}>
                      <select
                        value={assigned ?? ''}
                        onChange={(e) => assignStd(ab, e.target.value ? Number(e.target.value) : null)}
                        className="rounded border px-2 py-1 text-sm"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      >
                        <option value="">—</option>
                        {STANDARD_ARRAY.map((v) => (
                          <option key={v} value={v} disabled={assignedStd.includes(v) && assigned !== v}>{v}</option>
                        ))}
                      </select>
                      <span className="text-sm opacity-60 ml-2">{assigned !== null ? `= ${final} (${formatModifier(abilityModifier(final))})` : ''}</span>
                    </AbilityRow>
                  )
                })}
              </AbilityGrid>
            </div>
          )}

          {form.ability_method === 'pointbuy' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">Points spent: <strong>{pbSpent()}</strong> / {POINT_BUY_BUDGET}</p>
              <AbilityGrid>
                {ABILITIES.map((ab) => {
                  const score = form.base_scores[ab] ?? MIN_SCORE
                  const final = score + (racialBonuses[ab] ?? 0)
                  return (
                    <AbilityRow key={ab} label={ABILITY_LABELS[ab]} bonus={racialBonuses[ab]}>
                      <button onClick={() => adjustPB(ab, -1)} disabled={score <= MIN_SCORE}
                        className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                        style={{ borderColor: 'var(--color-border)' }}>−</button>
                      <span className="w-8 text-center font-mono text-sm">{score}</span>
                      <button onClick={() => adjustPB(ab, 1)} disabled={!canIncrement(ab)}
                        className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                        style={{ borderColor: 'var(--color-border)' }}>+</button>
                      <span className="text-sm opacity-60 ml-1">= {final} ({formatModifier(abilityModifier(final))})</span>
                    </AbilityRow>
                  )
                })}
              </AbilityGrid>
            </div>
          )}

          {form.ability_method === 'dice' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={rollAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Dices size={16} /> Roll All Stats
                </button>
                {form.dice_rolls.length > 0 && (
                  <span className="text-sm opacity-50">Results: {form.dice_rolls.join(', ')}</span>
                )}
              </div>
              {form.dice_rolls.length > 0 && (
                <AbilityGrid>
                  {ABILITIES.map((ab) => {
                    const assignedIdx = form.dice_assignments[ab]
                    const base = assignedIdx !== null ? (form.dice_rolls[assignedIdx] ?? DEFAULT_SCORE) : DEFAULT_SCORE
                    const final = base + (racialBonuses[ab] ?? 0)
                    return (
                      <AbilityRow key={ab} label={ABILITY_LABELS[ab]} bonus={racialBonuses[ab]}>
                        <select
                          value={assignedIdx ?? ''}
                          onChange={(e) => assignDice(ab, e.target.value !== '' ? Number(e.target.value) : null)}
                          className="rounded border px-2 py-1 text-sm"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        >
                          <option value="">—</option>
                          {form.dice_rolls.map((v, i) => (
                            <option key={i} value={i} disabled={assignedDice.includes(i) && assignedIdx !== i}>
                              {v} (roll {i + 1})
                            </option>
                          ))}
                        </select>
                        <span className="text-sm opacity-60 ml-2">
                          {assignedIdx !== null ? `= ${final} (${formatModifier(abilityModifier(final))})` : ''}
                        </span>
                      </AbilityRow>
                    )
                  })}
                </AbilityGrid>
              )}
            </div>
          )}

          {form.ability_method === 'manual' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">Enter any values (1–{MAX_SCORE_MANUAL}). Racial bonuses added automatically.</p>
              <AbilityGrid>
                {ABILITIES.map((ab) => {
                  const score = form.base_scores[ab] ?? DEFAULT_SCORE
                  const final = score + (racialBonuses[ab] ?? 0)
                  return (
                    <AbilityRow key={ab} label={ABILITY_LABELS[ab]} bonus={racialBonuses[ab]}>
                      <input
                        type="number" min={1} max={MAX_SCORE_MANUAL} value={score}
                        onChange={(e) => patch({ base_scores: { ...form.base_scores, [ab]: Math.min(MAX_SCORE_MANUAL, Math.max(1, Number(e.target.value))) } })}
                        className="w-16 rounded border px-2 py-1 text-sm text-center"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      />
                      <span className="text-sm opacity-60 ml-2">= {final} ({formatModifier(abilityModifier(final))})</span>
                    </AbilityRow>
                  )
                })}
              </AbilityGrid>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Skills & Background ── */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Skills &amp; Background</h2>

          {/* Class skills */}
          {classSkillOpts ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {selectedClass?.name ?? 'Class'} Skills
                </label>
                <span className="text-xs opacity-50">
                  {form.class_skills.length} / {skillCount} selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classSkillOpts.skills.map((skill) => {
                  const isSelected = form.class_skills.includes(skill)
                  const isBgSkill = bgSkills.includes(skill)
                  const disabled = !isSelected && form.class_skills.length >= skillCount
                  return (
                    <button
                      key={skill}
                      onClick={() => !isBgSkill && toggleSkill(skill)}
                      disabled={disabled && !isBgSkill}
                      className={cn(
                        'rounded-md border p-2 text-left text-sm transition-all disabled:opacity-40',
                        isSelected ? '' : 'hover:opacity-80',
                      )}
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: isSelected
                          ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                          : 'var(--color-surface)',
                      }}
                    >
                      <div className="font-medium">{slugToLabel(skill)}</div>
                      {isBgSkill && <div className="text-xs opacity-50">from background</div>}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-50">Select a class first to see available skills.</p>
          )}

          {/* Background */}
          <div>
            <label className="block text-sm font-medium mb-2">Background</label>
            {backgrounds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {backgrounds.map((b: DndBackgroundApi) => (
                  <SelectCard
                    key={b.id}
                    selected={form.background_id === b.id}
                    onClick={() => patch({ background_id: b.id })}
                    label={b.name}
                    sub={b.skill_proficiencies.slice(0, 2).map(slugToLabel).join(', ')}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-50">No backgrounds loaded.</p>
            )}
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm font-medium mb-2">Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNMENTS.map((a) => (
                <SelectCard key={a} selected={form.alignment === a} onClick={() => patch({ alignment: a })} label={slugToLabel(a)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Review &amp; Create</h2>
          <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <ReviewRow label="Name" value={form.name} />
            <ReviewRow label="Race" value={selectedRace ? `${selectedRace.name}${selectedSubrace ? ` (${selectedSubrace.name})` : ''}` : '—'} />
            <ReviewRow label="Class" value={selectedClass ? `${selectedClass.name} (Level ${form.level})` : '—'} />
            <ReviewRow label="Background" value={selectedBackground?.name ?? '—'} />
            <ReviewRow label="Alignment" value={slugToLabel(form.alignment)} />

            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs opacity-50 mb-2">Ability Scores (base + racial bonus)</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ABILITIES.map((ab) => {
                  const scores = finalScores()
                  const score = scores[ab] ?? DEFAULT_SCORE
                  const bonus = racialBonuses[ab]
                  return (
                    <div key={ab} className="text-center">
                      <div className="text-xs opacity-50">{ABILITY_SHORT[ab]}</div>
                      <div className="font-bold">{score}</div>
                      <div className="text-xs opacity-60">{formatModifier(abilityModifier(score))}</div>
                      {bonus && <div className="text-xs" style={{ color: 'var(--color-primary)' }}>+{bonus} racial</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {form.class_skills.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs opacity-50 mb-1">Skill Proficiencies</p>
                <div className="flex flex-wrap gap-1">
                  {[...new Set([...form.class_skills, ...bgSkills])].map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }}>
                      {slugToLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {createMutation.isError && (
            <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
              Failed to create character. Check the backend is running.
            </p>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => { if (step === 0) { void navigate('/characters') } else { setStep((s) => s - 1) } }}
          className="flex items-center gap-1 px-4 py-2 rounded-md border text-sm hover:opacity-80 transition-opacity"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChevronLeft size={16} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => { void handleSubmit() }}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Create Character
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Spinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 opacity-50">
      <Loader2 size={16} className="animate-spin" /> {text}
    </div>
  )
}

function SelectCard({ selected, onClick, label, sub, badge }: {
  selected: boolean; onClick: () => void; label: string; sub?: string; badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-md border p-2.5 text-left text-sm transition-all', selected ? '' : 'hover:opacity-80')}
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        backgroundColor: selected ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'var(--color-surface)',
      }}
    >
      <div className="font-medium flex items-center justify-between gap-1">
        {label}
        {badge && <span className="text-xs opacity-40 font-normal">{badge}</span>}
      </div>
      {sub !== undefined && <div className="text-xs opacity-50 mt-0.5">{sub}</div>}
    </button>
  )
}

function AbilityGrid({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function AbilityRow({ label, bonus, children }: { label: string; bonus?: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-28 text-sm shrink-0">{label}</span>
      {children}
      {bonus ? (
        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>+{bonus}</span>
      ) : null}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="opacity-50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
