import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowUp, Download, Link, Check, Loader2, AlertCircle } from 'lucide-react'
import CharacterSheet from '@/features/character/CharacterSheet'
import ProgressionTimeline from '@/features/character/ProgressionTimeline'
import ProgressionChart from '@/features/character/ProgressionChart'
import AIAdvisor from '@/features/character/AIAdvisor'
import { useCharacter, useLevelUpInfo } from '@/hooks/useCharacters'

const MAX_LEVEL = 20
const COPY_FEEDBACK_MS = 2000

function exportJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase().replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: character, isLoading, isError } = useCharacter(id)
  const { data: levelUpInfo } = useLevelUpInfo(id)
  const [copied, setCopied] = useState(false)

  const canLevelUp = levelUpInfo?.can_level_up === true
    && (character?.computed.total_level ?? MAX_LEVEL) < MAX_LEVEL

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => void navigate('/characters')}
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} /> Back to Characters
        </button>

        <div className="flex items-center gap-2">
          {/* Export JSON */}
          {character && (
            <button
              onClick={() => exportJson(character.name, { name: character.name, state: character.state })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
              style={{ borderColor: 'var(--color-border)' }}
              title="Export as JSON"
            >
              <Download size={13} /> Export
            </button>
          )}

          {/* Copy link */}
          <button
            onClick={() => void handleCopyLink()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
            style={{ borderColor: 'var(--color-border)' }}
            title="Copy share link"
          >
            {copied ? <Check size={13} /> : <Link size={13} />}
            {copied ? 'Copied!' : 'Share'}
          </button>

          {/* Level Up */}
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
          <AIAdvisor characterId={character.id} />
        </>
      )}
    </div>
  )
}
