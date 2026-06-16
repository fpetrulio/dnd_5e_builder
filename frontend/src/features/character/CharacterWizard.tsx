import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { cn, slugToLabel, formatModifier } from '@/lib/utils'
import { useCreateCharacter } from '@/hooks/useCharacters'
import { useClasses, useRaces, useBackgrounds } from '@/hooks/useResources'
import type { DndClassApi, DndRaceApi, DndBackgroundApi } from '@/hooks/useResources'

// D&D 5e constants
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const
const POINT_BUY_BUDGET = 27
const MIN_ABILITY_SCORE = 8
const MAX_ABILITY_SCORE_POINTBUY = 15
const MAX_ABILITY_SCORE_MANUAL = 30
const DEFAULT_ABILITY_SCORE = 10
const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}
const MAX_LEVEL = 20

type AbilityMethod = 'standard' | 'pointbuy' | 'manual'

interface WizardState {
  name: string
  race_id: string
  class_id: string
  background_id: string
  alignment: string
  ability_scores: Record<string, number>
  ability_method: AbilityMethod
  standard_assignments: Record<string, number | null>
  level: number
}

const ALIGNMENTS = [
  'lawful_good', 'neutral_good', 'chaotic_good',
  'lawful_neutral', 'true_neutral', 'chaotic_neutral',
  'lawful_evil', 'neutral_evil', 'chaotic_evil',
]

function abilityModifier(score: number): number {
  return Math.floor((score - DEFAULT_ABILITY_SCORE) / 2)
}

export default function CharacterWizard() {
  const navigate = useNavigate()
  const createMutation = useCreateCharacter()
  const { data: classes = [], isLoading: loadingClasses } = useClasses()
  const { data: races = [], isLoading: loadingRaces } = useRaces()
  const { data: backgrounds = [] } = useBackgrounds()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardState>({
    name: '',
    race_id: '',
    class_id: '',
    background_id: '',
    alignment: 'true_neutral',
    ability_scores: { str: DEFAULT_ABILITY_SCORE, dex: DEFAULT_ABILITY_SCORE, con: DEFAULT_ABILITY_SCORE, int: DEFAULT_ABILITY_SCORE, wis: DEFAULT_ABILITY_SCORE, cha: DEFAULT_ABILITY_SCORE },
    ability_method: 'standard',
    standard_assignments: Object.fromEntries(ABILITIES.map((a) => [a, null])),
    level: 1,
  })

  const steps = ['Identity', 'Abilities', 'Background', 'Review']

  function patch(updates: Partial<WizardState>) {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  // Standard array helpers
  const assignedValues = Object.values(form.standard_assignments).filter((v): v is number => v !== null)
  const availableValues = STANDARD_ARRAY.filter((v) => !assignedValues.includes(v))

  function assignStandardValue(ability: string, value: number | null) {
    const assignments = { ...form.standard_assignments, [ability]: value }
    const scores = { ...form.ability_scores }
    scores[ability] = value ?? DEFAULT_ABILITY_SCORE
    patch({ standard_assignments: assignments, ability_scores: scores })
  }

  // Point buy helpers
  function pointBuySpent(): number {
    return ABILITIES.reduce((sum, ab) => {
      const score = form.ability_scores[ab] ?? MIN_ABILITY_SCORE
      return sum + (POINT_BUY_COST[score] ?? 0)
    }, 0)
  }

  function canIncrement(ab: string): boolean {
    const cur = form.ability_scores[ab] ?? MIN_ABILITY_SCORE
    if (cur >= MAX_ABILITY_SCORE_POINTBUY) return false
    const nextCost = POINT_BUY_COST[cur + 1] ?? POINT_BUY_BUDGET + 1
    return pointBuySpent() - (POINT_BUY_COST[cur] ?? 0) + nextCost <= POINT_BUY_BUDGET
  }

  function adjustPointBuy(ab: string, delta: number) {
    const cur = form.ability_scores[ab] ?? MIN_ABILITY_SCORE
    const next = Math.max(MIN_ABILITY_SCORE, Math.min(MAX_ABILITY_SCORE_POINTBUY, cur + delta))
    patch({ ability_scores: { ...form.ability_scores, [ab]: next } })
  }

  function finalScores(): Record<string, number> {
    if (form.ability_method === 'standard') {
      return Object.fromEntries(
        ABILITIES.map((ab) => [ab, form.standard_assignments[ab] ?? DEFAULT_ABILITY_SCORE])
      )
    }
    return form.ability_scores
  }

  function canProceed(): boolean {
    if (step === 0) return form.name.trim().length > 0 && form.race_id !== '' && form.class_id !== ''
    if (step === 1 && form.ability_method === 'standard')
      return ABILITIES.every((ab) => form.standard_assignments[ab] !== null)
    return true
  }

  async function handleSubmit() {
    const scores = finalScores()
    await createMutation.mutateAsync({
      name: form.name.trim(),
      state: {
        race_id: form.race_id,
        background_id: form.background_id,
        alignment: form.alignment,
        classes: [{ class_id: form.class_id, level: form.level }],
        ability_scores: scores,
        current_level: form.level,
      },
    })
    void navigate('/characters')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                  i < step ? 'text-white' : i === step ? '' : 'opacity-30',
                )}
                style={{
                  backgroundColor: i < step ? 'var(--color-primary)' : undefined,
                  borderColor: i <= step ? 'var(--color-primary)' : undefined,
                  color: i === step ? 'var(--color-primary)' : undefined,
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="text-xs mt-1 opacity-60">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-5"
                style={{ backgroundColor: i < step ? 'var(--color-primary)' : 'var(--color-border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Identity */}
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
            {loadingRaces ? (
              <div className="flex items-center gap-2 opacity-50">
                <Loader2 size={16} className="animate-spin" /> Loading races...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {races.map((r: DndRaceApi) => (
                  <SelectCard
                    key={r.id}
                    selected={form.race_id === r.id}
                    onClick={() => patch({ race_id: r.id })}
                    label={r.name}
                    sub={`Speed ${r.speed}ft`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 opacity-50">
                <Loader2 size={16} className="animate-spin" /> Loading classes...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classes.map((c: DndClassApi) => (
                  <SelectCard
                    key={c.id}
                    selected={form.class_id === c.id}
                    onClick={() => patch({ class_id: c.id })}
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
              type="number"
              min={1}
              max={MAX_LEVEL}
              value={form.level}
              onChange={(e) => patch({ level: Math.min(MAX_LEVEL, Math.max(1, Number(e.target.value))) })}
              className="w-24 rounded-md border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Ability Scores */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Ability Scores</h2>

          <div className="flex gap-2">
            {(['standard', 'pointbuy', 'manual'] as AbilityMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => patch({ ability_method: m })}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  form.ability_method === m ? 'text-white border-transparent' : 'opacity-60',
                )}
                style={form.ability_method === m
                  ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                  : { borderColor: 'var(--color-border)' }}
              >
                {m === 'standard' ? 'Standard Array' : m === 'pointbuy' ? 'Point Buy' : 'Manual'}
              </button>
            ))}
          </div>

          {form.ability_method === 'standard' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">
                Assign values {STANDARD_ARRAY.join(', ')} to your abilities.
              </p>
              <div className="flex flex-wrap gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                {availableValues.map((v) => (
                  <span key={v} className="px-2 py-1 rounded border text-sm font-mono" style={{ borderColor: 'var(--color-border)' }}>{v}</span>
                ))}
                {availableValues.length === 0 && <span className="text-sm opacity-50">All values assigned</span>}
              </div>
              {ABILITIES.map((ab) => {
                const assigned = form.standard_assignments[ab]
                return (
                  <div key={ab} className="flex items-center gap-3">
                    <span className="w-28 text-sm">{ABILITY_LABELS[ab]}</span>
                    <select
                      value={assigned ?? ''}
                      onChange={(e) => assignStandardValue(ab, e.target.value ? Number(e.target.value) : null)}
                      className="rounded border px-2 py-1 text-sm"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <option value="">—</option>
                      {STANDARD_ARRAY.map((v) => (
                        <option
                          key={v}
                          value={v}
                          disabled={assignedValues.includes(v) && assigned !== v}
                        >
                          {v}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm opacity-50">
                      {assigned !== null
                        ? formatModifier(abilityModifier(assigned))
                        : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {form.ability_method === 'pointbuy' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">
                Points spent: <strong>{pointBuySpent()}</strong> / {POINT_BUY_BUDGET}
              </p>
              {ABILITIES.map((ab) => {
                const score = form.ability_scores[ab] ?? MIN_ABILITY_SCORE
                return (
                  <div key={ab} className="flex items-center gap-3">
                    <span className="w-28 text-sm">{ABILITY_LABELS[ab]}</span>
                    <button
                      onClick={() => adjustPointBuy(ab, -1)}
                      disabled={score <= MIN_ABILITY_SCORE}
                      className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                      style={{ borderColor: 'var(--color-border)' }}
                    >−</button>
                    <span className="w-8 text-center font-mono text-sm">{score}</span>
                    <button
                      onClick={() => adjustPointBuy(ab, 1)}
                      disabled={!canIncrement(ab)}
                      className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                      style={{ borderColor: 'var(--color-border)' }}
                    >+</button>
                    <span className="text-sm opacity-50">{formatModifier(abilityModifier(score))}</span>
                  </div>
                )
              })}
            </div>
          )}

          {form.ability_method === 'manual' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">Enter any values (1–{MAX_ABILITY_SCORE_MANUAL}).</p>
              {ABILITIES.map((ab) => {
                const score = form.ability_scores[ab] ?? DEFAULT_ABILITY_SCORE
                return (
                  <div key={ab} className="flex items-center gap-3">
                    <span className="w-28 text-sm">{ABILITY_LABELS[ab]}</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_ABILITY_SCORE_MANUAL}
                      value={score}
                      onChange={(e) =>
                        patch({
                          ability_scores: {
                            ...form.ability_scores,
                            [ab]: Math.min(MAX_ABILITY_SCORE_MANUAL, Math.max(1, Number(e.target.value))),
                          },
                        })
                      }
                      className="w-16 rounded border px-2 py-1 text-sm text-center"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    />
                    <span className="text-sm opacity-50">{formatModifier(abilityModifier(score))}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Background */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Background & Alignment</h2>

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
              <p className="text-sm opacity-50">No backgrounds loaded — skipping is optional.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alignment</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNMENTS.map((a) => (
                <SelectCard
                  key={a}
                  selected={form.alignment === a}
                  onClick={() => patch({ alignment: a })}
                  label={slugToLabel(a)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Review & Create</h2>
          <div
            className="rounded-lg border p-4 space-y-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <ReviewRow label="Name" value={form.name} />
            <ReviewRow label="Race" value={form.race_id ? slugToLabel(form.race_id) : '—'} />
            <ReviewRow label="Class" value={form.class_id ? `${slugToLabel(form.class_id)} (Level ${form.level})` : '—'} />
            <ReviewRow label="Background" value={form.background_id ? slugToLabel(form.background_id) : '—'} />
            <ReviewRow label="Alignment" value={slugToLabel(form.alignment)} />
            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map((ab) => {
                  const score = finalScores()[ab] ?? DEFAULT_ABILITY_SCORE
                  return (
                    <div key={ab} className="text-center">
                      <div className="text-xs opacity-50">{ab.toUpperCase()}</div>
                      <div className="font-bold">{score}</div>
                      <div className="text-sm opacity-60">{formatModifier(abilityModifier(score))}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => { if (step === 0) { void navigate('/characters') } else { setStep((s) => s - 1) } }}
          className="flex items-center gap-1 px-4 py-2 rounded-md border text-sm transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChevronLeft size={16} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-sm text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => { void handleSubmit() }}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white transition-colors disabled:opacity-40"
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

function SelectCard({
  selected, onClick, label, sub,
}: { selected: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border p-2.5 text-left text-sm transition-all',
        selected ? '' : 'hover:border-primary/40',
      )}
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        backgroundColor: selected ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'var(--color-surface)',
      }}
    >
      <div className="font-medium">{label}</div>
      {sub !== undefined && <div className="text-xs opacity-50 mt-0.5">{sub}</div>}
    </button>
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
