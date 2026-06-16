import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, UserPlus, Trash2, Loader2, AlertCircle, Shield, Heart, Zap } from 'lucide-react'
import { cn, slugToLabel, formatModifier } from '@/lib/utils'
import { useParty, useAddMember, useRemoveMember, useDeleteParty } from '@/hooks/useParty'
import { useCharacters } from '@/hooks/useCharacters'

const ROLE_LABELS: Record<string, string> = {
  frontline:   'Frontline',
  spellcaster: 'Spellcaster',
  healer:      'Healer',
  striker:     'Striker',
  controller:  'Controller',
  support:     'Support',
}

const ROLE_ICONS: Record<string, string> = {
  frontline:   '🛡️',
  spellcaster: '✨',
  healer:      '💚',
  striker:     '⚔️',
  controller:  '🌀',
  support:     '🤝',
}

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: party, isLoading, isError } = useParty(id)
  const { data: allChars = [] } = useCharacters()
  const { mutateAsync: addMember, isPending: isAdding } = useAddMember(id ?? '')
  const { mutateAsync: removeMember } = useRemoveMember(id ?? '')
  const { mutateAsync: deleteParty } = useDeleteParty()
  const [selectedCharId, setSelectedCharId] = useState('')
  const [addError, setAddError] = useState('')

  const memberIds = new Set(party?.members.map((m) => m.character_id) ?? [])
  const availableChars = allChars.filter((c) => !memberIds.has(c.id))

  const handleAdd = async () => {
    if (!selectedCharId) return
    setAddError('')
    try {
      await addMember(selectedCharId)
      setSelectedCharId('')
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add member')
    }
  }

  const handleRemove = async (characterId: string) => {
    await removeMember(characterId)
  }

  const handleDeleteParty = async () => {
    if (!confirm(`Delete party "${party?.name ?? ''}"? This cannot be undone.`)) return
    await deleteParty(id ?? '')
    void navigate('/party')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 opacity-50">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading…</span>
      </div>
    )
  }

  if (isError || !party) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
        <AlertCircle size={16} />
        <span className="text-sm">Party not found.</span>
      </div>
    )
  }

  const roleCoverage = party.role_coverage

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => void navigate('/party')}
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} /> All Parties
        </button>
        <button
          onClick={() => void handleDeleteParty()}
          className="flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition-opacity"
        >
          <Trash2 size={12} /> Delete Party
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{party.name}</h1>
        <p className="text-sm opacity-50">{party.members.length} member{party.members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Role coverage */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="text-xs font-medium opacity-50 uppercase tracking-wider mb-3">Role Coverage</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(roleCoverage).map(([role, covered]) => (
            <div
              key={role}
              className={cn(
                'rounded-lg border p-2 text-center text-xs transition-all',
                covered ? '' : 'opacity-30',
              )}
              style={{
                borderColor: covered ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: covered
                  ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                  : 'var(--color-surface)',
              }}
            >
              <div className="text-lg mb-0.5">{ROLE_ICONS[role] ?? '?'}</div>
              <div className={cn('font-medium', covered ? '' : 'opacity-50')}
                style={{ color: covered ? 'var(--color-primary)' : 'inherit' }}>
                {ROLE_LABELS[role] ?? role}
              </div>
            </div>
          ))}
        </div>
        {Object.values(roleCoverage).some((v) => !v) && (
          <p className="text-xs opacity-40 mt-2">
            Faded roles are not covered by any current party member.
          </p>
        )}
      </div>

      {/* Members */}
      <div className="space-y-3">
        <div className="text-xs font-medium opacity-50 uppercase tracking-wider">Members</div>

        {party.members.length === 0 && (
          <div className="text-sm opacity-40 text-center py-6">No members yet. Add characters below.</div>
        )}

        {party.members.map((m) => (
          <div
            key={m.character_id}
            className="rounded-lg border p-4 flex items-center gap-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex-1 min-w-0">
              <button
                onClick={() => void navigate(`/characters/${m.character_id}`)}
                className="font-medium text-sm hover:underline text-left"
                style={{ color: 'var(--color-primary)' }}
              >
                {m.name}
              </button>
              <p className="text-xs opacity-50 mt-0.5">
                {slugToLabel(m.race_id)} · {slugToLabel(m.class_id)} {m.level}
                {m.background_id ? ` · ${slugToLabel(m.background_id)}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0">
              <StatBadge icon={<Heart size={10} />} value={String(m.hp)} label="HP" />
              <StatBadge icon={<Shield size={10} />} value={String(m.ac)} label="AC" />
              <StatBadge icon={<Zap size={10} />} value={formatModifier(m.ac - 10)} label="Init" />
            </div>

            <button
              onClick={() => void handleRemove(m.character_id)}
              className="opacity-30 hover:opacity-70 transition-opacity shrink-0"
              title="Remove from party"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add member */}
      {availableChars.length > 0 && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="text-xs font-medium opacity-50 uppercase tracking-wider">Add Member</div>
          <div className="flex gap-2">
            <select
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              className="flex-1 px-3 py-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <option value="">— select character —</option>
              {availableChars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Lv {c.computed.total_level} {slugToLabel(c.state.classes[0]?.class_id ?? '')})
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleAdd()}
              disabled={!selectedCharId || isAdding}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Add
            </button>
          </div>
          {addError && <p className="text-xs" style={{ color: '#f87171' }}>{addError}</p>}
        </div>
      )}

      {availableChars.length === 0 && party.members.length > 0 && (
        <p className="text-xs opacity-40 text-center">All your characters are already in this party.</p>
      )}
    </div>
  )
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center gap-0.5 opacity-50">{icon}<span>{value}</span></div>
      <div className="opacity-30">{label}</div>
    </div>
  )
}
