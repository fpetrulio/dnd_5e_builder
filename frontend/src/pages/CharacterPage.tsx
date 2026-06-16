import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowUp, Loader2, AlertCircle } from 'lucide-react'
import CharacterSheet from '@/features/character/CharacterSheet'
import ProgressionTimeline from '@/features/character/ProgressionTimeline'
import ProgressionChart from '@/features/character/ProgressionChart'
import { useCharacter, useLevelUpInfo } from '@/hooks/useCharacters'

const MAX_LEVEL = 20

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: character, isLoading, isError } = useCharacter(id)
  const { data: levelUpInfo } = useLevelUpInfo(id)

  const canLevelUp = levelUpInfo?.can_level_up === true
    && (character?.computed.total_level ?? MAX_LEVEL) < MAX_LEVEL

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => void navigate('/characters')}
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} /> Back to Characters
        </button>

        {canLevelUp && (
          <button
            onClick={() => void navigate(`/characters/${id ?? ''}/level-up`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            <ArrowUp size={14} />
            Level Up
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 opacity-50">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {isError && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg border"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <AlertCircle size={16} />
          <span className="text-sm">Character not found or backend is unreachable.</span>
        </div>
      )}

      {character && (
        <>
          <CharacterSheet character={character} />
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <ProgressionTimeline
              characterId={character.id}
              currentLevel={character.computed.total_level}
            />
            <ProgressionChart characterId={character.id} />
          </div>
        </>
      )}
    </div>
  )
}
