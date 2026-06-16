import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, Clock } from 'lucide-react'
import CharacterSheet from '@/features/character/CharacterSheet'
import { useCharacterSnapshot } from '@/hooks/useCharacters'

export default function SnapshotPage() {
  const { id, level } = useParams<{ id: string; level: string }>()
  const navigate = useNavigate()
  const levelNum = level !== undefined ? parseInt(level, 10) : undefined
  const { data: snapshot, isLoading, isError } = useCharacterSnapshot(id, levelNum)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => void navigate(`/characters/${id ?? ''}`)}
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} /> Back to Character
        </button>
        <div
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
          style={{ borderColor: 'var(--color-border)', opacity: 0.6 }}
        >
          <Clock size={10} /> Snapshot at level {level}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 opacity-50">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading snapshot…</span>
        </div>
      )}

      {isError && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg border"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <AlertCircle size={16} />
          <span className="text-sm">Snapshot not found.</span>
        </div>
      )}

      {snapshot && (
        <div className="space-y-2">
          <div
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            This is a read-only snapshot of <strong>{snapshot.name}</strong> at level {level}. Saved on {new Date(snapshot.created_at).toLocaleDateString()}.
          </div>
          <CharacterSheet character={snapshot} />
        </div>
      )}
    </div>
  )
}
