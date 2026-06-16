import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import CharacterSheet from '@/features/character/CharacterSheet'
import { useCharacter } from '@/hooks/useCharacters'

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: character, isLoading, isError } = useCharacter(id)

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/characters')}
        className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={16} /> Back to Characters
      </button>

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

      {character && <CharacterSheet character={character} />}
    </div>
  )
}
