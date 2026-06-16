import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { useParties, useCreateParty, useDeleteParty } from '@/hooks/useParty'

export default function PartyPage() {
  const navigate = useNavigate()
  const { data: parties = [], isLoading } = useParties()
  const { mutateAsync: createParty, isPending: isCreating } = useCreateParty()
  const { mutateAsync: deleteParty } = useDeleteParty()
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const party = await createParty(name)
    setNewName('')
    setShowForm(false)
    void navigate(`/party/${party.id}`)
  }

  const handleDelete = async (e: React.MouseEvent, partyId: string, partyName: string) => {
    e.stopPropagation()
    if (!confirm(`Delete "${partyName}"?`)) return
    await deleteParty(partyId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Party Builder</h1>
          <p className="text-sm opacity-50 mt-0.5">Organize characters into parties and analyze role coverage.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          <Plus size={14} /> New Party
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="text-sm font-medium">New Party</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
              placeholder="Party name…"
              autoFocus
              className="flex-1 px-3 py-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            />
            <button
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || isCreating}
              className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName('') }}
              className="px-3 py-2 rounded text-sm opacity-50 hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Party list */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 opacity-50">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {!isLoading && parties.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Users size={40} className="mx-auto opacity-20" />
          <p className="text-sm opacity-40">No parties yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-4 py-2 rounded font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            Create your first party
          </button>
        </div>
      )}

      <div className="space-y-3">
        {parties.map((party) => (
          <button
            key={party.id}
            onClick={() => void navigate(`/party/${party.id}`)}
            className="w-full rounded-lg border p-4 flex items-center gap-3 text-left transition-all hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
            >
              <Users size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{party.name}</div>
              <div className="text-xs opacity-50">
                {party.member_count} member{party.member_count !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={(e) => void handleDelete(e, party.id, party.name)}
              className="opacity-20 hover:opacity-60 transition-opacity shrink-0 p-1"
            >
              <Trash2 size={14} />
            </button>
            <ChevronRight size={16} className="opacity-30 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
