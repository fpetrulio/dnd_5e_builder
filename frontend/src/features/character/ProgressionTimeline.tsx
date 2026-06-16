import { useNavigate } from 'react-router-dom'
import { Clock, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const INACTIVE_OPACITY = 0.4
import { useSnapshots, useRevert } from '@/hooks/useCharacters'
import type { SnapshotSummary } from '@/hooks/useCharacters'

interface Props {
  characterId: string
  currentLevel: number
}

export default function ProgressionTimeline({ characterId, currentLevel }: Props) {
  const navigate = useNavigate()
  const { data: snapshots = [], isLoading } = useSnapshots(characterId)
  const { mutateAsync: revert, isPending: isReverting } = useRevert(characterId)

  if (isLoading) return null
  if (snapshots.length === 0 && currentLevel <= 1) return null

  const snapshotByLevel = new Map<number, SnapshotSummary>(
    snapshots.map((s) => [s.level, s]),
  )

  const handleViewSnapshot = (level: number) => {
    void navigate(`/characters/${characterId}/snapshot/${level}`)
  }

  const handleRevert = async (level: number) => {
    if (!confirm(`Revert to level ${level}? This will undo all progress after level ${level}.`)) return
    await revert(level)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium opacity-50 uppercase tracking-wider">
        <Clock size={12} />
        Progression History
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: currentLevel }).map((_, i) => {
            const level = i + 1
            const snap = snapshotByLevel.get(level)
            const isCurrent = level === currentLevel
            const hasSnapshot = snap !== undefined

            return (
              <div key={level} className="flex flex-col items-center gap-1">
                {/* Level bubble */}
                <div className="flex items-center gap-1">
                  {hasSnapshot && (
                    <button
                      onClick={() => handleViewSnapshot(level)}
                      title={`View character at level ${level}`}
                      className={cn(
                        'w-8 h-8 rounded-full border text-xs font-bold transition-all hover:scale-110',
                        'flex items-center justify-center',
                      )}
                      style={{
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {level}
                    </button>
                  )}
                  {!hasSnapshot && (
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border text-xs font-bold',
                        'flex items-center justify-center',
                      )}
                      style={{
                        borderColor: isCurrent ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: isCurrent
                          ? 'var(--color-primary)'
                          : 'var(--color-surface)',
                        color: isCurrent ? 'var(--color-bg)' : 'inherit',
                        opacity: isCurrent ? 1 : INACTIVE_OPACITY,
                      }}
                    >
                      {level}
                    </div>
                  )}
                </div>

                {/* Revert button (only for snapshot levels, not current) */}
                {hasSnapshot && !isCurrent && (
                  <button
                    onClick={() => void handleRevert(level)}
                    disabled={isReverting}
                    title={`Revert to level ${level}`}
                    className="opacity-30 hover:opacity-70 transition-opacity"
                  >
                    {isReverting
                      ? <Loader2 size={10} className="animate-spin" />
                      : <RotateCcw size={10} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {snapshots.length > 0 && (
        <p className="text-xs opacity-40">
          Click a level bubble to view that snapshot · <RotateCcw size={9} className="inline" /> to revert
        </p>
      )}
    </div>
  )
}
