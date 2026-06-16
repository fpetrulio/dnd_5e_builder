import type { ReactNode } from 'react'
import { useState } from 'react'
import { Shield, Heart, Zap, Wind, Star, BookOpen, Dices, Sparkles } from 'lucide-react'
import { cn, formatModifier, slugToLabel } from '@/lib/utils'
import type { CharacterApiResponse } from '@/hooks/useCharacters'
import { useClassFeatures } from '@/hooks/useResources'
import type { ClassFeatureApi } from '@/hooks/useResources'

type Tab = 'overview' | 'abilities' | 'skills' | 'features' | 'spells'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

interface Props {
  character: CharacterApiResponse
}

export default function CharacterSheet({ character }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { state, computed } = character

  const primaryClass = state.classes.length > 0 ? state.classes[0] : null
  const classLabel = primaryClass != null
    ? `${slugToLabel(primaryClass.class_id)} ${computed.total_level}`
    : `Level ${computed.total_level}`

  const { data: classFeatures = [] } = useClassFeatures(
    primaryClass?.class_id,
    computed.total_level,
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'skills', label: 'Skills' },
    { id: 'features', label: 'Features' },
    { id: 'spells', label: 'Spells' },
  ]

  const hasSpellcasting = computed.spell_save_dc != null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{character.name}</h1>
        <p className="opacity-60 text-sm mt-0.5">
          {state.race_id ? slugToLabel(state.race_id) : ''}
          {state.subrace_id ? ` (${slugToLabel(state.subrace_id)})` : ''}
          {state.race_id ? ' · ' : ''}
          {classLabel}
          {state.background_id ? ` · ${slugToLabel(state.background_id)}` : ''}
        </p>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <QuickStat icon={<Heart size={16} />} label="HP" value={String(computed.hp_max)} color="var(--color-primary)" />
        <QuickStat icon={<Shield size={16} />} label="AC" value={String(computed.armor_class)} />
        <QuickStat icon={<Zap size={16} />} label="Initiative" value={formatModifier(computed.initiative)} />
        <QuickStat icon={<Wind size={16} />} label="Speed" value={`${computed.speed}ft`} />
        <QuickStat icon={<Star size={16} />} label="Prof Bonus" value={formatModifier(computed.proficiency_bonus)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === t.id ? '' : 'border-transparent opacity-50 hover:opacity-80',
            )}
            style={activeTab === t.id ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
          >
            {t.label}
            {t.id === 'features' && classFeatures.length > 0 && (
              <span className="ml-1.5 text-xs opacity-50">({classFeatures.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {ABILITIES.map((ab) => {
              const score = state.ability_scores[ab] ?? 10
              const mod = computed.ability_modifiers[ab] ?? 0
              return (
                <div key={ab} className="rounded-lg border p-3 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="text-xs font-medium opacity-50 mb-1">{ABILITY_LABELS[ab]}</div>
                  <div className="text-2xl font-bold">{formatModifier(mod)}</div>
                  <div className="text-sm opacity-60">{score}</div>
                </div>
              )
            })}
          </div>

          {hasSpellcasting && (
            <div className="rounded-lg border p-3 flex gap-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div>
                <div className="text-xs opacity-50">Spell Save DC</div>
                <div className="font-bold">{computed.spell_save_dc}</div>
              </div>
              <div>
                <div className="text-xs opacity-50">Spell Attack</div>
                <div className="font-bold">{formatModifier(computed.spell_attack_bonus ?? 0)}</div>
              </div>
            </div>
          )}

          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="text-xs font-medium opacity-50 mb-1">Passive Perception</div>
            <div className="font-bold">{computed.passive_perception}</div>
          </div>
        </div>
      )}

      {/* Tab: Abilities */}
      {activeTab === 'abilities' && (
        <div className="space-y-3">
          {ABILITIES.map((ab) => {
            const score = state.ability_scores[ab] ?? 10
            const mod = computed.ability_modifiers[ab] ?? 0
            const save = computed.saving_throws[ab] ?? mod
            const saveProf = save > mod
            return (
              <div key={ab} className="rounded-lg border p-3 flex items-center gap-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="w-12 text-center">
                  <div className="text-xs opacity-50">{ABILITY_LABELS[ab]}</div>
                  <div className="text-xl font-bold">{formatModifier(mod)}</div>
                  <div className="text-xs opacity-40">{score}</div>
                </div>
                <div className="flex-1 border-l pl-4" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xs opacity-50 mb-0.5">Saving Throw</div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', saveProf ? '' : 'opacity-20')}
                      style={{ backgroundColor: saveProf ? 'var(--color-primary)' : 'currentColor' }} />
                    <span className="text-sm font-medium">{formatModifier(save)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="space-y-1">
          {Object.entries(computed.skills)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([skill, bonus]) => {
              const isProficient = state.skill_proficiencies.includes(skill)
              const isExpert = state.skill_expertise.includes(skill)
              return (
                <div key={skill} className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div className="w-2.5 h-2.5 rounded-full border" style={{
                    borderColor: isProficient || isExpert ? 'var(--color-primary)' : undefined,
                    backgroundColor: isExpert ? 'var(--color-primary)' : undefined,
                  }} />
                  <span className="flex-1 text-sm">{slugToLabel(skill)}</span>
                  <span className="text-sm font-mono font-medium">{formatModifier(bonus)}</span>
                </div>
              )
            })}
        </div>
      )}

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {classFeatures.length === 0 ? (
            <div className="text-center opacity-40 py-8">
              <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No features found for this class.</p>
            </div>
          ) : (
            <>
              {/* Group features by level */}
              {Array.from(new Set(classFeatures.map((f: ClassFeatureApi) => f.level))).map((lvl) => {
                const levelFeatures = classFeatures.filter((f: ClassFeatureApi) => f.level === lvl)
                return (
                  <div key={lvl}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
                      >
                        Level {lvl}
                      </div>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                    </div>
                    <div className="space-y-2">
                      {levelFeatures.map((f: ClassFeatureApi) => (
                        <div
                          key={`${lvl}-${f.name}`}
                          className="rounded-lg border p-3"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        >
                          <div className="font-medium text-sm">{f.name}</div>
                          <div className="text-xs opacity-60 mt-1 leading-relaxed">{f.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Skill proficiencies summary */}
              {state.skill_proficiencies.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="text-xs font-medium opacity-50 mb-2">Skill Proficiencies</div>
                  <div className="flex flex-wrap gap-1">
                    {state.skill_proficiencies.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }}>
                        {slugToLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Spells */}
      {activeTab === 'spells' && (
        <div className="space-y-4">
          {Object.keys(computed.spell_slots).length === 0 ? (
            <div className="text-center opacity-50 py-8">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">This character has no spell slots.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(computed.spell_slots).map(([level, count]) => (
                  <div key={level} className="rounded-lg border p-2 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <div className="text-xs opacity-50">{level.startsWith('pact') ? 'Pact' : `Level ${level}`}</div>
                    <div className="font-bold flex items-center justify-center gap-1 mt-1">
                      <Dices size={12} className="opacity-50" />{count}
                    </div>
                  </div>
                ))}
              </div>

              {(state.spells_known.length > 0 || state.cantrips_known.length > 0) && (
                <div>
                  {state.cantrips_known.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium opacity-50 mb-2">Cantrips</h4>
                      <div className="flex flex-wrap gap-1">
                        {state.cantrips_known.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }}>{slugToLabel(s)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {state.spells_known.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium opacity-50 mb-2">Spells Known</h4>
                      <div className="flex flex-wrap gap-1">
                        {state.spells_known.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--color-border)' }}>{slugToLabel(s)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border p-3 flex flex-col items-center gap-1" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div style={{ color: color ?? 'inherit' }} className="opacity-60">{icon}</div>
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs opacity-50">{label}</div>
    </div>
  )
}
