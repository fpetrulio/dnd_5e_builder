import { useState } from 'react'
import { Plus, Trash2, Loader2, AlertCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHomebrew, useCreateHomebrew, useDeleteHomebrew } from '@/hooks/useHomebrew'
import type { HomebrewCreatePayload } from '@/hooks/useHomebrew'

const RESOURCE_TYPES = ['spell', 'item', 'monster', 'class', 'background', 'feat', 'race', 'other'] as const
type ResourceType = (typeof RESOURCE_TYPES)[number]

const EMPTY_FORM: HomebrewCreatePayload = {
  type: 'spell',
  name: '',
  source_label: 'Homebrew',
  data: {},
}

export default function HomebrewPage() {
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<HomebrewCreatePayload>(EMPTY_FORM)
  const [rawData, setRawData] = useState('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: resources = [], isLoading, isError } = useHomebrew(
    activeType === 'all' ? undefined : activeType,
  )
  const createHomebrew = useCreateHomebrew()
  const deleteHomebrew = useDeleteHomebrew()

  function patch(p: Partial<HomebrewCreatePayload>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function handleRawDataChange(value: string) {
    setRawData(value)
    try {
      JSON.parse(value)
      setJsonError(null)
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(rawData) as Record<string, unknown>
    } catch {
      setJsonError('Invalid JSON — fix before saving')
      return
    }
    await createHomebrew.mutateAsync({ ...form, data: parsedData })
    setForm(EMPTY_FORM)
    setRawData('{}')
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await deleteHomebrew.mutateAsync(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homebrew</h1>
          <p className="text-sm opacity-60 mt-0.5">Custom rules, items, spells, and more</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setJsonError(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          <Plus size={16} /> New Resource
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="font-semibold">New Homebrew Resource</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="text-xs opacity-50">Name *</label>
              <input
                value={form.name}
                onChange={(e) => { patch({ name: e.target.value }) }}
                placeholder="Fireball of Doom"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              />
            </div>

            {/* Type */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="text-xs opacity-50">Type *</label>
              <select
                value={form.type}
                onChange={(e) => { patch({ type: e.target.value }) }}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div className="space-y-1 col-span-2">
              <label className="text-xs opacity-50">Source label</label>
              <input
                value={form.source_label ?? 'Homebrew'}
                onChange={(e) => { patch({ source_label: e.target.value }) }}
                placeholder="My Campaign"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              />
            </div>

            {/* JSON Data */}
            <div className="space-y-1 col-span-2">
              <label className="text-xs opacity-50">Data (JSON)</label>
              <textarea
                value={rawData}
                onChange={(e) => { handleRawDataChange(e.target.value) }}
                rows={6}
                spellCheck={false}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono resize-y"
                style={{
                  borderColor: jsonError ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                }}
                placeholder='{"damage": "8d6", "range": "150 feet"}'
              />
              {jsonError && (
                <p className="text-xs" style={{ color: 'var(--color-primary)' }}>{jsonError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setRawData('{}') }}
              className="px-4 py-2 rounded-lg border text-sm hover:opacity-70 transition-opacity"
              style={{ borderColor: 'var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { void handleCreate() }}
              disabled={!form.name.trim() || !!jsonError || createHomebrew.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              {createHomebrew.isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>

          {createHomebrew.error instanceof Error && (
            <p className="text-xs text-center" style={{ color: 'var(--color-primary)' }}>
              {createHomebrew.error.message}
            </p>
          )}
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['all', ...RESOURCE_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t) }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeType === t ? 'opacity-100' : 'opacity-50 hover:opacity-75',
            )}
            style={{
              backgroundColor: activeType === t
                ? 'var(--color-primary)'
                : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
              color: activeType === t ? 'var(--color-bg)' : 'inherit',
            }}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 opacity-50">
          <Loader2 size={20} className="animate-spin" /> Loading…
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-4 rounded-lg border text-sm" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          <AlertCircle size={16} /> Failed to load homebrew resources.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && resources.length === 0 && (
        <div className="text-center py-20 opacity-40 space-y-2">
          <Package size={40} className="mx-auto" />
          <p className="text-sm">No homebrew resources yet.</p>
          <p className="text-xs">Click "New Resource" to add custom spells, items, and more.</p>
        </div>
      )}

      {/* Resource list */}
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border p-4 flex items-start justify-between gap-3"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {r.type}
                  </span>
                  <span className="text-xs opacity-40">{r.source}</span>
                </div>
                {Object.keys(r.data).length > 0 && (
                  <pre
                    className="mt-2 text-xs opacity-50 overflow-x-auto rounded p-2"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    {JSON.stringify(r.data, null, 2)}
                  </pre>
                )}
              </div>

              {deleteConfirm === r.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs opacity-60">Delete?</span>
                  <button
                    onClick={() => { void handleDelete(r.id) }}
                    disabled={deleteHomebrew.isPending}
                    className="text-xs px-2 py-1 rounded font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  >
                    {deleteHomebrew.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Yes'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(null) }}
                    className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setDeleteConfirm(r.id) }}
                  className="p-1.5 rounded transition-opacity opacity-40 hover:opacity-80 shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
