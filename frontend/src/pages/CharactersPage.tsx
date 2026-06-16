import { useRef, useState } from 'react'
import { Plus, Upload, Loader2, AlertCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CharacterCard from '@/features/character/CharacterCard'
import { useCharacters, useCreateCharacter } from '@/hooks/useCharacters'

export default function CharactersPage() {
  const navigate = useNavigate()
  const { data: characters, isLoading, isError } = useCharacters()
  const createCharacter = useCreateCharacter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  function handleImportClick() {
    setImportError(null)
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const raw: unknown = JSON.parse(event.target?.result as string)
        if (
          typeof raw !== 'object' ||
          raw === null ||
          !('name' in raw) ||
          !('state' in raw) ||
          typeof (raw as Record<string, unknown>).name !== 'string' ||
          typeof (raw as Record<string, unknown>).state !== 'object'
        ) {
          setImportError('Invalid character JSON: must have "name" (string) and "state" (object).')
          return
        }
        const payload = raw as { name: string; state: Record<string, unknown> }
        createCharacter.mutate(
          { name: payload.name, state: payload.state },
          {
            onSuccess: (created) => void navigate(`/characters/${created.id}`),
            onError: (err) => setImportError(err instanceof Error ? err.message : 'Import failed.'),
          },
        )
      } catch {
        setImportError('Could not parse file — make sure it is a valid JSON file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Characters</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleImportClick}
            disabled={createCharacter.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {createCharacter.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Import JSON
          </button>
          <button
            onClick={() => void navigate('/characters/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            New Character
          </button>
        </div>
      </div>

      {importError && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          <AlertCircle size={15} />
          {importError}
        </div>
      )}

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
