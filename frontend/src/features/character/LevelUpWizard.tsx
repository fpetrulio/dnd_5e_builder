import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Dice6, Loader2, Sparkles } from 'lucide-react'
import { cn, slugToLabel, formatModifier } from '@/lib/utils'
import { useLevelUpInfo, useLevelUp } from '@/hooks/useCharacters'
import type { LevelUpChoices, ASIChoice } from '@/hooks/useCharacters'
import { useClassFeatures } from '@/hooks/useResources'
import type { ClassFeatureApi } from '@/hooks/useResources'

// ─── Constants ────────────────────────────────────────────────────────────────

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}
const ABILITY_SHORT: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

type ASIMethod = 'single' | 'split' | 'feat' | 'none'
type HpMethod = 'average' | 'roll' | 'manual'

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  characterId: string
  characterName: string
  abilityScores: Record<string, number>
  onSuccess: () => void
  onCancel: () => void
}

export default function LevelUpWizard({
  characterId,
  characterName,
  abilityScores,
  onSuccess,
  onCancel,
}: Props) {
  const { data: info, isLoading } = useLevelUpInfo(characterId)
  const { mutateAsync: levelUp, isPending, error } = useLevelUp(characterId)

  // Step state
  const [step, setStep] = useState(0)

  // HP state
  const [hpMethod, setHpMethod] = useState<HpMethod>('average')
  const [rolledHp, setRolledHp] = useState<number | null>(null)
  const [manualHp, setManualHp] = useState<string>('')

  // Subclass state
  const [subclassInput, setSubclassInput] = useState('')

  // ASI state
  const [asiMethod, setAsiMethod] = useState<ASIMethod>('single')
  const [abilitySingle, setAbilitySingle] = useState<string>('')
  const [abilityA, setAbilityA] = useState<string>('')
  const [abilityB, setAbilityB] = useState<string>('')
  const [featName, setFeatName] = useState('')

  const { data: allFeatures = [] } = useClassFeatures(
    info?.class_id,
    info?.new_class_level ?? 0,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 opacity-50">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading level-up data…</span>
      </div>
    )
  }

  if (!info?.can_level_up) {
    return (
      <div className="text-center py-20 opacity-50">
        <p>{info?.reason ?? 'Cannot level up.'}</p>
      </div>
    )
  }

  const newLevel = info.new_total_level ?? 1
  const newClassLevel = info.new_class_level ?? 1
  const die = info.hit_die ?? 8
  const averageHp = info.average_hp ?? (Math.ceil(die / 2) + 1)
  const newFeatures = allFeatures.filter((f: ClassFeatureApi) => f.level === newClassLevel)

  // Build step list dynamically based on what's needed
  const steps = [
    'overview',
    'hp',
    ...(info.has_subclass_choice ? ['subclass'] : []),
    ...(info.has_asi ? ['asi'] : []),
    'confirm',
  ] as const

  const totalSteps = steps.length
  const currentStep: string = steps[step]

  const canProceed = (): boolean => {
    if (currentStep === 'hp') {
      if (hpMethod === 'roll' && rolledHp === null) return false
      if (hpMethod === 'manual') {
        const val = parseInt(manualHp, 10)
        if (isNaN(val) || val < 1 || val > die) return false
      }
    }
    if (currentStep === 'asi') {
      if (asiMethod === 'single' && !abilitySingle) return false
      if (asiMethod === 'split' && (!abilityA || !abilityB || abilityA === abilityB)) return false
      if (asiMethod === 'feat' && !featName.trim()) return false
    }
    return true
  }

  const rollDie = () => {
    const roll = Math.ceil(Math.random() * die)
    setRolledHp(roll)
  }

  const handleSubmit = async () => {
    let hpVal: number | undefined
    if (hpMethod === 'roll') hpVal = rolledHp ?? undefined
    else if (hpMethod === 'manual') hpVal = parseInt(manualHp, 10)

    let asiChoice: ASIChoice | undefined
    if (info.has_asi) {
      asiChoice = {
        method: asiMethod,
        ability_single: asiMethod === 'single' ? abilitySingle : undefined,
        ability_a: asiMethod === 'split' ? abilityA : undefined,
        ability_b: asiMethod === 'split' ? abilityB : undefined,
        feat_name: asiMethod === 'feat' ? featName.trim() : undefined,
      }
    }

    const choices: LevelUpChoices = {
      hp_method: hpMethod,
      hp_value: hpVal,
      subclass_id: subclassInput.trim() || undefined,
      asi_choice: asiChoice,
    }

    await levelUp(choices)
    onSuccess()
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity mb-3"
        >
          <ChevronLeft size={16} /> Cancel
        </button>
        <h1 className="text-2xl font-bold">{characterName}</h1>
        <p className="opacity-60 text-sm">
          Level Up — reaching level <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{newLevel}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{
              backgroundColor: i <= step
                ? 'var(--color-primary)'
                : 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
            }}
          />
        ))}
      </div>

      {/* ── Step: Overview ─────────────────────────────────────────── */}
      {currentStep === 'overview' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            What you gain at level {newLevel}
          </h2>

          {newFeatures.length > 0 ? (
            <div className="space-y-2">
              {newFeatures.map((f) => (
                <div
                  key={f.name}
                  className="rounded-lg border p-3"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="font-medium text-sm">{f.name}</div>
                  <div className="text-xs opacity-60 mt-1 leading-relaxed">{f.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-lg border p-4 text-sm opacity-60"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              No new class features at this level — but your proficiency bonus and base stats may improve.
            </div>
          )}

          {info.has_asi && (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Ability Score Improvement</strong> — you can increase one score by +2, two scores by +1 each, or take a feat.
            </div>
          )}

          {info.has_subclass_choice && (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Subclass choice</strong> — you will choose your archetype.
            </div>
          )}
        </div>
      )}

      {/* ── Step: HP ───────────────────────────────────────────────── */}
      {currentStep === 'hp' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Hit Points</h2>
          <p className="text-sm opacity-60">
            Hit die: <strong>d{die}</strong> · Average: <strong>{averageHp}</strong> (max {die})
          </p>

          {/* Average */}
          <label
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all',
              hpMethod === 'average' ? 'border-[var(--color-primary)]' : '',
            )}
            style={{
              borderColor: hpMethod === 'average' ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <input
              type="radio"
              name="hp_method"
              value="average"
              checked={hpMethod === 'average'}
              onChange={() => setHpMethod('average')}
              className="accent-[--color-primary]"
            />
            <div>
              <div className="font-medium text-sm">Take average</div>
              <div className="text-xs opacity-60">+{averageHp} HP (always safe choice)</div>
            </div>
            {hpMethod === 'average' && (
              <div className="ml-auto text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                +{averageHp}
              </div>
            )}
          </label>

          {/* Roll */}
          <label
            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all"
            style={{
              borderColor: hpMethod === 'roll' ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <input
              type="radio"
              name="hp_method"
              value="roll"
              checked={hpMethod === 'roll'}
              onChange={() => setHpMethod('roll')}
              className="mt-0.5 accent-[--color-primary]"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Roll the die</div>
              <div className="text-xs opacity-60 mb-2">1d{die} (min 1)</div>
              {hpMethod === 'roll' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={rollDie}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  >
                    <Dice6 size={14} /> Roll d{die}
                  </button>
                  {rolledHp !== null && (
                    <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                      +{rolledHp}
                    </span>
                  )}
                </div>
              )}
            </div>
          </label>

          {/* Manual */}
          <label
            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all"
            style={{
              borderColor: hpMethod === 'manual' ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <input
              type="radio"
              name="hp_method"
              value="manual"
              checked={hpMethod === 'manual'}
              onChange={() => setHpMethod('manual')}
              className="mt-0.5 accent-[--color-primary]"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Enter manually</div>
              <div className="text-xs opacity-60 mb-2">Type your rolled result (1–{die})</div>
              {hpMethod === 'manual' && (
                <input
                  type="number"
                  min={1}
                  max={die}
                  value={manualHp}
                  onChange={(e) => setManualHp(e.target.value)}
                  placeholder={`1–${die}`}
                  className="w-20 px-2 py-1 rounded border text-sm text-center"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </label>
        </div>
      )}

      {/* ── Step: Subclass ─────────────────────────────────────────── */}
      {currentStep === 'subclass' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose Your Archetype</h2>
          <p className="text-sm opacity-60">
            At level {newClassLevel}, your {slugToLabel(info.class_id ?? '')} chooses a subclass (archetype). Enter the subclass name, or leave blank to decide later.
          </p>
          <input
            type="text"
            value={subclassInput}
            onChange={(e) => setSubclassInput(e.target.value)}
            placeholder="e.g. School of Evocation, Berserker, Champion…"
            className="w-full px-3 py-2 rounded border text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
          <p className="text-xs opacity-40">Mechanical effects of subclass features are not yet computed. This is for record-keeping.</p>
        </div>
      )}

      {/* ── Step: ASI ──────────────────────────────────────────────── */}
      {currentStep === 'asi' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ability Score Improvement</h2>

          {/* Method selector */}
          <div className="grid grid-cols-3 gap-2">
            {(['single', 'split', 'feat'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAsiMethod(m)}
                className={cn(
                  'rounded-lg border p-2 text-xs font-medium transition-all',
                  asiMethod === m ? '' : 'opacity-60 hover:opacity-80',
                )}
                style={{
                  borderColor: asiMethod === m ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: asiMethod === m
                    ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                    : 'var(--color-surface)',
                  color: asiMethod === m ? 'var(--color-primary)' : 'inherit',
                }}
              >
                {m === 'single' ? '+2 to one' : m === 'split' ? '+1 to two' : 'Feat'}
              </button>
            ))}
          </div>

          {/* +2 to one ability */}
          {asiMethod === 'single' && (
            <div className="space-y-2">
              <p className="text-sm opacity-60">Choose one ability to increase by +2 (max 20):</p>
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map((ab) => {
                  const score = abilityScores[ab] ?? 10
                  const capped = score >= 20
                  return (
                    <button
                      key={ab}
                      type="button"
                      disabled={capped}
                      onClick={() => setAbilitySingle(ab)}
                      className={cn(
                        'rounded-lg border p-2 text-center transition-all',
                        capped ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80',
                        abilitySingle === ab ? '' : 'opacity-60',
                      )}
                      style={{
                        borderColor: abilitySingle === ab ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: abilitySingle === ab
                          ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                          : 'var(--color-surface)',
                      }}
                    >
                      <div className="text-xs opacity-60">{ABILITY_SHORT[ab]}</div>
                      <div className="font-bold text-sm">{score} → {Math.min(20, score + 2)}</div>
                      <div className="text-xs opacity-50">{formatModifier(Math.floor((Math.min(20, score + 2) - 10) / 2))}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* +1 to two abilities */}
          {asiMethod === 'split' && (
            <div className="space-y-3">
              <p className="text-sm opacity-60">Choose two different abilities to increase by +1 each (max 20):</p>
              {(['First', 'Second'] as const).map((label, idx) => {
                const chosen = idx === 0 ? abilityA : abilityB
                const other = idx === 0 ? abilityB : abilityA
                const setChosen = idx === 0 ? setAbilityA : setAbilityB
                return (
                  <div key={label}>
                    <p className="text-xs font-medium opacity-50 mb-1">{label} ability:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ABILITIES.map((ab) => {
                        const score = abilityScores[ab] ?? 10
                        const capped = score >= 20
                        const locked = ab === other
                        return (
                          <button
                            key={ab}
                            type="button"
                            disabled={capped || locked}
                            onClick={() => setChosen(ab)}
                            className={cn(
                              'rounded-lg border p-2 text-center transition-all',
                              capped || locked ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80',
                              chosen === ab ? '' : 'opacity-60',
                            )}
                            style={{
                              borderColor: chosen === ab ? 'var(--color-primary)' : 'var(--color-border)',
                              backgroundColor: chosen === ab
                                ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                                : 'var(--color-surface)',
                            }}
                          >
                            <div className="text-xs opacity-60">{ABILITY_SHORT[ab]}</div>
                            <div className="font-bold text-sm">{score} → {Math.min(20, score + 1)}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Feat */}
          {asiMethod === 'feat' && (
            <div className="space-y-2">
              <p className="text-sm opacity-60">Enter the name of the feat you're taking:</p>
              <input
                type="text"
                value={featName}
                onChange={(e) => setFeatName(e.target.value)}
                placeholder="e.g. Sharpshooter, War Caster, Lucky…"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              />
              <p className="text-xs opacity-40">Feat mechanical effects are not yet computed. This records your choice.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Confirm ──────────────────────────────────────────── */}
      {currentStep === 'confirm' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Confirm Level Up</h2>

          <div
            className="rounded-lg border divide-y text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <SummaryRow label="New level" value={`${newLevel}`} highlight />

            {/* HP */}
            <SummaryRow
              label="HP gain"
              value={
                hpMethod === 'average'
                  ? `+${averageHp} (average)`
                  : hpMethod === 'roll'
                    ? `+${rolledHp ?? '?'} (rolled)`
                    : `+${manualHp} (manual)`
              }
            />

            {/* Subclass */}
            {info.has_subclass_choice && (
              <SummaryRow
                label="Subclass"
                value={subclassInput.trim() || '(not chosen yet)'}
              />
            )}

            {/* ASI */}
            {info.has_asi && (
              <SummaryRow
                label="ASI"
                value={
                  asiMethod === 'single' && abilitySingle
                    ? `+2 ${ABILITY_LABELS[abilitySingle]} (${abilityScores[abilitySingle] ?? 10} → ${Math.min(20, (abilityScores[abilitySingle] ?? 10) + 2)})`
                    : asiMethod === 'split' && abilityA && abilityB
                      ? `+1 ${ABILITY_LABELS[abilityA]}, +1 ${ABILITY_LABELS[abilityB]}`
                      : asiMethod === 'feat' && featName
                        ? `Feat: ${featName}`
                        : '(none chosen)'
                }
              />
            )}
          </div>

          {error instanceof Error && (
            <div
              className="text-sm p-3 rounded-lg border"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              {error.message}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(step - 1) : onCancel()}
          className="flex items-center gap-1 px-3 py-2 rounded text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {currentStep === 'confirm' ? (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Level Up!
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-4 py-2 rounded font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ color: highlight ? 'var(--color-primary)' : 'inherit' }}>
      <span className="opacity-60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
