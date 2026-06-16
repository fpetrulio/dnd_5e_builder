import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import LevelUpWizard from '@/features/character/LevelUpWizard'
import { useCharacter } from '@/hooks/useCharacters'

export default function LevelUpWizardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: character, isLoading, isError } = useCharacter(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 opacity-50">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading…</span>
      </div>
    )
  }

  if (isError || !character) {
    return (
      <div
        className="flex items-center gap-2 p-4 rounded-lg border"
        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
      >
        <AlertCircle size={16} />
        <span className="text-sm">Character not found or backend is unreachable.</span>
      </div>
    )
  }

  const back = () => void navigate(`/characters/${id ?? ''}`)

  return (
    <LevelUpWizard
      characterId={character.id}
      characterName={character.name}
      abilityScores={character.state.ability_scores}
      onSuccess={back}
      onCancel={back}
    />
  )
}
