import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIAdvise } from '@/hooks/useAI'
import type { AISuggestion } from '@/hooks/useAI'

const GOAL_PRESETS = [
  'Optimize for maximum damage per round',
  'Maximize survivability and tankiness',
  'Balance offense and defense',
  'Maximize utility and party support',
  'Solo adventuring efficiency',
]

const PRIORITY_COLORS: Record<string, string> = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#34d399',
}

interface Props {
  characterId: string
}

export default function AIAdvisor({ characterId }: Props) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState('')
  const { mutateAsync: analyze, data, isPending, error, reset } = useAIAdvise()

  const handleAnalyze = async () => {
    reset()
    await analyze({ characterId, goal: goal.trim() || GOAL_PRESETS[2] })
  }

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-medium text-sm">AI Build Advisor</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            Claude
          </span>
        </div>
        {open ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Goal input */}
          <div className="space-y-2 pt-3">
            <label className="text-xs opacity-50 font-medium">Optimization goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={GOAL_PRESETS[2]}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            />
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1">
              {GOAL_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setGoal(p)}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border transition-all',
                    goal === p ? '' : 'opacity-50 hover:opacity-80',
                  )}
                  style={{
                    borderColor: goal === p ? 'var(--color-primary)' : 'var(--color-border)',
                    color: goal === p ? 'var(--color-primary)' : 'inherit',
                    backgroundColor: goal === p
                      ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                      : 'transparent',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => void handleAnalyze()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            {isPending
              ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
              : <><Sparkles size={14} /> Analyze Build</>}
          </button>

          {error instanceof Error && (
            <div
              className="flex items-center gap-2 text-sm p-3 rounded-lg border"
              style={{ borderColor: '#f87171', color: '#f87171' }}
            >
              <AlertCircle size={14} />
              {error.message}
            </div>
          )}

          {/* Results */}
          {data && (
            <div className="space-y-4">
              {/* Raw fallback */}
              {data.raw && (
                <div className="text-xs opacity-60 whitespace-pre-wrap font-mono p-3 rounded border"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {data.raw}
                </div>
              )}

              {/* Analysis */}
              {data.analysis && (
                <div className="text-sm opacity-80 leading-relaxed p-3 rounded-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, transparent)' }}>
                  {data.analysis}
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {((data.strengths?.length ?? 0) > 0 || (data.weaknesses?.length ?? 0) > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {data.strengths && data.strengths.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: '#34d399' }}>Strengths</div>
                      <ul className="space-y-1">
                        {data.strengths.map((s, i) => (
                          <li key={i} className="text-xs flex gap-1.5">
                            <span style={{ color: '#34d399' }}>+</span>
                            <span className="opacity-70">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.weaknesses && data.weaknesses.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: '#f87171' }}>Weaknesses</div>
                      <ul className="space-y-1">
                        {data.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs flex gap-1.5">
                            <span style={{ color: '#f87171' }}>−</span>
                            <span className="opacity-70">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {data.suggestions && data.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium opacity-50">Suggestions</div>
                  {data.suggestions.map((s: AISuggestion, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 text-xs space-y-1"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${PRIORITY_COLORS[s.priority] ?? '#888'} 20%, transparent)`,
                            color: PRIORITY_COLORS[s.priority] ?? '#888',
                          }}
                        >
                          {s.priority}
                        </span>
                        <span className="opacity-40">{s.category}</span>
                      </div>
                      <div className="font-medium">{s.suggestion}</div>
                      <div className="opacity-60 flex gap-1">
                        <ArrowRight size={10} className="mt-0.5 shrink-0" />
                        {s.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alternative builds */}
              {data.alternative_builds && data.alternative_builds.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium opacity-50">Alternative Builds</div>
                  {data.alternative_builds.map((alt, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 text-xs space-y-0.5"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                    >
                      <div className="font-medium">{alt.name}</div>
                      <div className="opacity-60">{alt.description}</div>
                      <div className="opacity-40 italic">{alt.trade_offs}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
