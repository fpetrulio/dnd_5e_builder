import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatModifier } from '@/lib/utils'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_SHORT: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
const SCORE_DOMAIN: [number, number] = [0, 20]
const NEGATIVE_MOD_OPACITY = 0.6

interface Props {
  abilityScores: Record<string, number>
  abilityModifiers: Record<string, number>
}

export default function StatsRadarChart({ abilityScores, abilityModifiers }: Props) {
  const data = ABILITIES.map((ab) => ({
    ability: ABILITY_SHORT[ab],
    score: abilityScores[ab] ?? 10,
    mod: abilityModifiers[ab] ?? 0,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="ability"
            tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis domain={SCORE_DOMAIN} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            fill="var(--color-primary)"
            fillOpacity={0.25}
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
          />
          <Tooltip
            formatter={(value, _name, entry: { payload?: { mod?: number } }) => {
              const mod = entry.payload?.mod ?? 0
              return [`${String(value)} (${formatModifier(mod)})`, 'Score']
            }}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score legend below chart */}
      <div className="grid grid-cols-6 gap-1 mt-1">
        {ABILITIES.map((ab) => {
          const score = abilityScores[ab] ?? 10
          const mod = abilityModifiers[ab] ?? 0
          return (
            <div key={ab} className="text-center">
              <div className="text-xs opacity-40">{ABILITY_SHORT[ab]}</div>
              <div className="text-sm font-bold">{score}</div>
              <div className="text-xs" style={{ color: mod >= 0 ? 'var(--color-primary)' : 'inherit', opacity: mod < 0 ? NEGATIVE_MOD_OPACITY : 1 }}>
                {formatModifier(mod)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

