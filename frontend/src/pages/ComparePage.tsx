import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { cn, formatModifier, slugToLabel } from '@/lib/utils'
import { useCharacters } from '@/hooks/useCharacters'
import type { CharacterApiResponse } from '@/hooks/useCharacters'
import { useAICompare } from '@/hooks/useAI'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

function diff(a: number, b: number): 'higher' | 'lower' | 'equal' {
  if (a > b) return 'higher'
  if (a < b) return 'lower'
  return 'equal'
}

function StatCell({ value, comparison }: { value: string; comparison: 'higher' | 'lower' | 'equal' }) {
  return (
    <td
      className="px-4 py-2.5 text-sm font-medium text-center"
      style={{
        color: comparison === 'higher' ? '#34d399'
          : comparison === 'lower' ? '#f87171'
          : 'inherit',
      }}
    >
      {value}
    </td>
  )
}

function CharacterSelector({
  characters,
  selected,
  exclude,
  onSelect,
  label,
}: {
  characters: CharacterApiResponse[]
  selected: string
  exclude: string
  onSelect: (id: string) => void
  label: string
}) {
  return (
    <div className="space-y-1 flex-1">
      <label className="text-xs opacity-50 font-medium">{label}</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 rounded border text-sm"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <option value="">— select character —</option>
        {characters
          .filter((c) => c.id !== exclude)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (Lv {c.computed.total_level} {slugToLabel(c.state.classes[0]?.class_id ?? '')})
            </option>
          ))}
      </select>
    </div>
  )
}

export default function ComparePage() {
  const { data: characters = [], isLoading } = useCharacters()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')
  const { mutateAsync: aiCompare, data: aiResult, isPending: isAiPending, error: aiError } = useAICompare()

  const charA = characters.find((c) => c.id === idA)
  const charB = characters.find((c) => c.id === idB)
  const bothSelected = charA !== undefined && charB !== undefined

  const handleAICompare = async () => {
    if (!bothSelected) return
    await aiCompare([idA, idB])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 opacity-50">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading characters…</span>
      </div>
    )
  }

  if (characters.length < 2) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Compare Builds</h1>
        <div className="text-sm opacity-50">You need at least 2 characters to compare. Create more characters first.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compare Builds</h1>

      {/* Character selectors */}
      <div className="flex gap-4">
        <CharacterSelector
          characters={characters}
          selected={idA}
          exclude={idB}
          onSelect={setIdA}
          label="Character A"
        />
        <div className="flex items-end pb-2 font-bold opacity-30">vs</div>
        <CharacterSelector
          characters={characters}
          selected={idB}
          exclude={idA}
          onSelect={setIdB}
          label="Character B"
        />
      </div>

      {/* Comparison table */}
      {charA !== undefined && charB !== undefined && (
        <div className="space-y-4">
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium opacity-50 uppercase tracking-wider w-1/3">Stat</th>
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                    {charA.name}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#60a5fa' }}>
                    {charB.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>

                {/* Identity */}
                <CompareRow label="Class / Level"
                  a={`${slugToLabel(charA.state.classes[0]?.class_id ?? '')} ${charA.computed.total_level}`}
                  b={`${slugToLabel(charB.state.classes[0]?.class_id ?? '')} ${charB.computed.total_level}`}
                />
                <CompareRow label="Race"
                  a={`${slugToLabel(charA.state.race_id)}${charA.state.subrace_id ? ` (${slugToLabel(charA.state.subrace_id)})` : ''}`}
                  b={`${slugToLabel(charB.state.race_id)}${charB.state.subrace_id ? ` (${slugToLabel(charB.state.subrace_id)})` : ''}`}
                />
                <CompareRow label="Background"
                  a={slugToLabel(charA.state.background_id)}
                  b={slugToLabel(charB.state.background_id)}
                />

                {/* Section header */}
                <SectionHeader label="Combat" />

                <CompareNumRow label="Max HP"
                  a={charA.computed.hp_max} b={charB.computed.hp_max} higherIsBetter />
                <CompareNumRow label="Armor Class"
                  a={charA.computed.armor_class} b={charB.computed.armor_class} higherIsBetter />
                <CompareNumRow label="Initiative"
                  a={charA.computed.initiative} b={charB.computed.initiative} higherIsBetter
                  format={formatModifier} />
                <CompareNumRow label="Speed (ft)"
                  a={charA.computed.speed} b={charB.computed.speed} higherIsBetter />
                <CompareNumRow label="Proficiency Bonus"
                  a={charA.computed.proficiency_bonus} b={charB.computed.proficiency_bonus} higherIsBetter
                  format={formatModifier} />

                {/* Abilities */}
                <SectionHeader label="Ability Scores" />
                {ABILITIES.map((ab) => (
                  <CompareNumRow
                    key={ab}
                    label={ABILITY_LABELS[ab]}
                    a={charA.state.ability_scores[ab] ?? 10}
                    b={charB.state.ability_scores[ab] ?? 10}
                    higherIsBetter
                    format={(v) => `${v} (${formatModifier(charA.computed.ability_modifiers[ab] ?? 0)})`}
                    formatB={(v) => `${v} (${formatModifier(charB.computed.ability_modifiers[ab] ?? 0)})`}
                  />
                ))}

                {/* Spellcasting */}
                {(charA.computed.spell_save_dc != null || charB.computed.spell_save_dc != null) && (
                  <>
                    <SectionHeader label="Spellcasting" />
                    <CompareNumRow label="Spell Save DC"
                      a={charA.computed.spell_save_dc ?? 0} b={charB.computed.spell_save_dc ?? 0} higherIsBetter />
                    <CompareNumRow label="Spell Attack Bonus"
                      a={charA.computed.spell_attack_bonus ?? 0} b={charB.computed.spell_attack_bonus ?? 0}
                      higherIsBetter format={formatModifier} />
                  </>
                )}

                {/* Passive */}
                <SectionHeader label="Passive" />
                <CompareNumRow label="Passive Perception"
                  a={charA.computed.passive_perception} b={charB.computed.passive_perception} higherIsBetter />
              </tbody>
            </table>
          </div>

          {/* Skill proficiencies comparison */}
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="text-xs font-medium opacity-50 uppercase tracking-wider mb-3">Skill Proficiencies</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium mb-1" style={{ color: 'var(--color-primary)' }}>{charA.name}</div>
                <div className="flex flex-wrap gap-1">
                  {charA.state.skill_proficiencies.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        'px-1.5 py-0.5 rounded border',
                        charB.state.skill_proficiencies.includes(s) ? 'opacity-40' : '',
                      )}
                      style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                    >
                      {slugToLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1" style={{ color: '#60a5fa' }}>{charB.name}</div>
                <div className="flex flex-wrap gap-1">
                  {charB.state.skill_proficiencies.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        'px-1.5 py-0.5 rounded border',
                        charA.state.skill_proficiencies.includes(s) ? 'opacity-40' : '',
                      )}
                      style={{ borderColor: '#60a5fa', color: '#60a5fa' }}
                    >
                      {slugToLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs opacity-30 mt-2">Faded = shared by both. Colored = exclusive.</p>
          </div>

          {/* AI Compare */}
          <div
            className="rounded-lg border p-4 space-y-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                AI Analysis
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                    color: 'var(--color-primary)',
                  }}
                >Claude</span>
              </div>
              <button
                onClick={() => void handleAICompare()}
                disabled={isAiPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                {isAiPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {isAiPending ? 'Analyzing…' : 'Compare with AI'}
              </button>
            </div>

            {aiError instanceof Error && (
              <div className="flex items-center gap-2 text-xs p-2 rounded border" style={{ borderColor: '#f87171', color: '#f87171' }}>
                <AlertCircle size={12} /> {aiError.message}
              </div>
            )}

            {aiResult && (
              <div className="space-y-3 text-sm">
                {aiResult.summary && (
                  <p className="opacity-70 leading-relaxed">{aiResult.summary}</p>
                )}

                {aiResult.comparison && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(aiResult.comparison).map(([cat, { winner, reasoning }]) => (
                      <div
                        key={cat}
                        className="rounded-lg border p-3 text-xs space-y-1"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                      >
                        <div className="font-medium capitalize opacity-50">{cat}</div>
                        <div className="font-bold"
                          style={{ color: winner === charA.name ? 'var(--color-primary)' : '#60a5fa' }}>
                          {winner}
                        </div>
                        <div className="opacity-50 leading-relaxed">{reasoning}</div>
                      </div>
                    ))}
                  </div>
                )}

                {aiResult.recommendation && (
                  <div
                    className="p-3 rounded-lg text-xs leading-relaxed"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--color-primary)' }}>Recommendation: </span>
                    {aiResult.recommendation}
                  </div>
                )}

                {aiResult.raw && (
                  <pre className="text-xs opacity-50 whitespace-pre-wrap font-mono">{aiResult.raw}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' }}>
      <td colSpan={3} className="px-4 py-1.5 text-xs font-semibold opacity-40 uppercase tracking-wider">
        {label}
      </td>
    </tr>
  )
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr style={{ borderColor: 'var(--color-border)' }}>
      <td className="px-4 py-2.5 text-xs opacity-50">{label}</td>
      <td className="px-4 py-2.5 text-sm text-center">{a || '—'}</td>
      <td className="px-4 py-2.5 text-sm text-center">{b || '—'}</td>
    </tr>
  )
}

function CompareNumRow({
  label,
  a,
  b,
  higherIsBetter,
  format,
  formatB,
}: {
  label: string
  a: number
  b: number
  higherIsBetter: boolean
  format?: (v: number) => string
  formatB?: (v: number) => string
}) {
  const cmpA = higherIsBetter ? diff(a, b) : diff(b, a)
  const cmpB = higherIsBetter ? diff(b, a) : diff(a, b)
  const fmtA = format ?? String
  const fmtB = formatB ?? format ?? String

  return (
    <tr style={{ borderColor: 'var(--color-border)' }}>
      <td className="px-4 py-2.5 text-xs opacity-50">{label}</td>
      <StatCell value={fmtA(a)} comparison={cmpA} />
      <StatCell value={fmtB(b)} comparison={cmpB} />
    </tr>
  )
}
