import { useNavigate } from 'react-router-dom'
import { Sword, Users, GitCompare, Package, ArrowRight } from 'lucide-react'
import { useCharacters } from '@/hooks/useCharacters'

export default function HomePage() {
  const navigate = useNavigate()
  const { data: characters = [] } = useCharacters()

  const totalCharacters = characters.length
  const maxLevel = characters.reduce((max, c) => Math.max(max, c.computed.total_level), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">D&D 5e Character Builder</h1>
        <p className="opacity-60 mt-1">
          Create, manage and optimize your characters for Dungeons &amp; Dragons 5th Edition.
        </p>
      </div>

      {/* Stats summary */}
      {totalCharacters > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Characters" value={String(totalCharacters)} />
          <StatCard label="Highest Level" value={String(maxLevel)} />
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium opacity-50 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={<Sword size={20} />}
            title="New Character"
            description="Start the character creation wizard."
            onClick={() => navigate('/characters/new')}
            primary
          />
          <ActionCard
            icon={<Users size={20} />}
            title="My Characters"
            description={`${totalCharacters} character${totalCharacters !== 1 ? 's' : ''} saved.`}
            onClick={() => navigate('/characters')}
          />
          <ActionCard
            icon={<GitCompare size={20} />}
            title="Compare Builds"
            description="Side-by-side build analysis."
            onClick={() => navigate('/compare')}
          />
          <ActionCard
            icon={<Package size={20} />}
            title="Homebrew"
            description="Manage custom resources."
            onClick={() => navigate('/homebrew')}
          />
        </div>
      </div>

      {/* Recent characters */}
      {totalCharacters > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium opacity-50 uppercase tracking-wider">Recent Characters</h2>
            <button
              onClick={() => navigate('/characters')}
              className="flex items-center gap-1 text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {characters.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/characters/${c.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border text-left hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs opacity-50">
                    Level {c.computed.total_level} ·{' '}
                    {c.state.classes[0]?.class_id ?? 'Unknown class'}
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-30" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-50 mt-0.5">{label}</div>
    </div>
  )
}

function ActionCard({
  icon, title, description, onClick, primary,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-lg border text-left hover:opacity-90 transition-opacity"
      style={{
        borderColor: primary ? 'var(--color-primary)' : 'var(--color-border)',
        backgroundColor: primary
          ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
          : 'var(--color-surface)',
      }}
    >
      <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-50 mt-0.5">{description}</div>
      </div>
    </button>
  )
}
