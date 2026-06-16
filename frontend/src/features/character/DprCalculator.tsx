import { useState } from 'react'
import { Swords } from 'lucide-react'
import { formatModifier } from '@/lib/utils'

const DIE_OPTIONS = [4, 6, 8, 10, 12] as const
type DieFace = (typeof DIE_OPTIONS)[number]

const MIN_HIT_CHANCE = 0.05
const MAX_HIT_CHANCE = 0.95
const DEFAULT_TARGET_AC = 15
const DEFAULT_ATTACKS = 1
const DEFAULT_NUM_DICE = 1
// In 5e, a roll of 21+ always hits regardless of modifiers: P(hit) = (21 + bonus - AC) / 20
const HIT_FORMULA_BASE = 21

interface Props {
  proficiencyBonus: number
  strMod: number
  dexMod: number
}

export default function DprCalculator({ proficiencyBonus, strMod, dexMod }: Props) {
  const defaultAttackBonus = Math.max(strMod, dexMod) + proficiencyBonus

  const [attacks, setAttacks] = useState(DEFAULT_ATTACKS)
  const [numDice, setNumDice] = useState(DEFAULT_NUM_DICE)
  const [die, setDie] = useState<DieFace>(8)
  const [damageBonus, setDamageBonus] = useState(Math.max(strMod, dexMod))
  const [attackBonus, setAttackBonus] = useState(defaultAttackBonus)
  const [targetAc, setTargetAc] = useState(DEFAULT_TARGET_AC)

  const hitChance = Math.max(
    MIN_HIT_CHANCE,
    Math.min(MAX_HIT_CHANCE, (HIT_FORMULA_BASE + attackBonus - targetAc) / 20),
  )
  const avgDie = (die + 1) / 2
  const avgDamagePerHit = numDice * avgDie + damageBonus
  const dpr = attacks * hitChance * avgDamagePerHit

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium opacity-50 uppercase tracking-wider flex items-center gap-2">
        <Swords size={12} /> DPR Calculator
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Attacks per action */}
        <Field label="Attacks / action">
          <NumberInput value={attacks} min={1} max={4} onChange={setAttacks} />
        </Field>

        {/* Attack bonus */}
        <Field label={`Attack bonus (base ${formatModifier(defaultAttackBonus)})`}>
          <NumberInput value={attackBonus} min={-5} max={20} onChange={setAttackBonus} />
        </Field>

        {/* Damage dice */}
        <Field label="Damage dice">
          <div className="flex items-center gap-1">
            <NumberInput value={numDice} min={1} max={8} onChange={setNumDice} className="w-12" />
            <span className="opacity-40 text-xs">×</span>
            <select
              value={die}
              onChange={(e) => setDie(parseInt(e.target.value, 10) as DieFace)}
              className="flex-1 px-2 py-1 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {DIE_OPTIONS.map((d) => (
                <option key={d} value={d}>d{d}</option>
              ))}
            </select>
          </div>
        </Field>

        {/* Damage bonus */}
        <Field label="Damage bonus">
          <NumberInput value={damageBonus} min={-5} max={20} onChange={setDamageBonus} />
        </Field>

        {/* Target AC */}
        <Field label="Target AC">
          <NumberInput value={targetAc} min={5} max={30} onChange={setTargetAc} />
        </Field>

        {/* Hit chance (read-only) */}
        <Field label="Hit chance">
          <div
            className="px-2 py-1 rounded border text-sm font-mono text-center"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {Math.round(hitChance * 100)}%
          </div>
        </Field>
      </div>

      {/* Result */}
      <div
        className="rounded-lg border p-4 text-center"
        style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
      >
        <div className="text-xs opacity-50 mb-1">Expected DPR</div>
        <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
          {dpr.toFixed(1)}
        </div>
        <div className="text-xs opacity-40 mt-1">
          {attacks} × {Math.round(hitChance * 100)}% × ({numDice}d{die} + {formatModifier(damageBonus)})
          &nbsp;= {dpr.toFixed(2)} avg damage/round
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs opacity-50">{label}</label>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  min,
  max,
  onChange,
  className,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10)
        if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
      }}
      className={`w-full px-2 py-1 rounded border text-sm text-center ${className ?? ''}`}
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    />
  )
}
