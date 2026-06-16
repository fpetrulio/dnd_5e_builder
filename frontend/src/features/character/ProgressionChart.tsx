import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgression } from '@/hooks/useCharacters'

type Metric = 'hp' | 'ac' | 'proficiency_bonus' | 'initiative'

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: 'hp', label: 'Max HP', color: 'var(--color-primary)' },
  { key: 'ac', label: 'AC', color: '#60a5fa' },
  { key: 'proficiency_bonus', label: 'Prof Bonus', color: '#34d399' },
  { key: 'initiative', label: 'Initiative', color: '#f59e0b' },
]

interface Props {
  characterId: string
}

export default function ProgressionChart({ characterId }: Props) {
  const { data: points = [] } = useProgression(characterId)
  const [active, setActive] = useState<Set<Metric>>(new Set(['hp', 'ac']))

  if (points.length < 2) return null

  const toggle = (key: Metric) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium opacity-50 uppercase tracking-wider">
        <TrendingUp size={12} />
        Stat Progression
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-all',
              active.has(key) ? 'opacity-100' : 'opacity-40',
            )}
            style={{
              borderColor: active.has(key) ? color : 'var(--color-border)',
              color: active.has(key) ? color : 'inherit',
              backgroundColor: active.has(key)
                ? `color-mix(in srgb, ${color} 12%, transparent)`
                : 'transparent',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="level"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
            label={{ value: 'Level', position: 'insideBottom', offset: -2, fontSize: 10, opacity: 0.5 }}
            height={28}
          />
          <YAxis tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} width={28} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={(label: number) => `Level ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
            formatter={(value: string) =>
              METRICS.find((m) => m.key === value)?.label ?? value
            }
          />
          {METRICS.filter(({ key }) => active.has(key)).map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: color }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
