import { Plus, Loader2, AlertCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CharacterCard from '@/features/character/CharacterCard'
import { useCharacters } from '@/hooks/useCharacters'

export default function CharactersPage() {
  const navigate = useNavigate()
  const { data: characters, isLoading, isError } = useCharacters()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Characters</h1>
        <button
          onClick={() => navigate('/characters/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={16} />
          New Character
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 opacity-50">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading characters...</span>
        </div>
      )}

      {isError && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg border"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <AlertCircle size={16} />
          <span className="text-sm">Failed to load characters. Is the backend running?</span>
        </div>
      )}

      {!isLoading && !isError && characters?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
          <Users size={48} />
          <p className="text-sm">No characters yet.</p>
          <button
            onClick={() => navigate('/characters/new')}
            className="text-sm underline"
          >
            Create your first character
          </button>
        </div>
      )}

      {!isLoading && !isError && characters && characters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  )
}
