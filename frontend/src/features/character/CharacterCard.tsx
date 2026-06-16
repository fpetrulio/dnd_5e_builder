import type { MouseEvent } from 'react'
import { Sword, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, formatModifier, slugToLabel } from '@/lib/utils'
import type { CharacterApiResponse } from '@/hooks/useCharacters'
import { useDeleteCharacter } from '@/hooks/useCharacters'

interface Props {
  character: CharacterApiResponse
}

export default function CharacterCard({ character }: Props) {
  const navigate = useNavigate()
  const deleteMutation = useDeleteCharacter()
  const { state, computed } = character

  const primaryClass = state.classes.length > 0 ? state.classes[0] : null
  const classLabel = primaryClass != null
    ? `${slugToLabel(primaryClass.class_id)} ${computed.total_level}`
    : `Level ${computed.total_level}`

  const raceLabel = state.race_id ? slugToLabel(state.race_id) : 'Unknown race'

  function handleDelete(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    deleteMutation.mutate(character.id)
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 cursor-pointer transition-all',
        'hover:shadow-md hover:border-primary/50',
      )}
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      onClick={() => void navigate(`/characters/${character.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') void navigate(`/characters/${character.id}`) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sword size={18} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
          <h3 className="font-semibold text-base truncate">{character.name}</h3>
        </div>
        <button
          onClick={handleDelete}
          className="shrink-0 p-1 rounded opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity"
          aria-label="Delete character"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <p className="text-sm mt-1 opacity-60">
        {raceLabel} · {classLabel}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <StatBox label="HP" value={String(computed.hp_max)} />
        <StatBox label="AC" value={String(computed.armor_class)} />
        <StatBox label="Init" value={formatModifier(computed.initiative)} />
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded p-1.5"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="text-xs opacity-50">{label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  )
}
