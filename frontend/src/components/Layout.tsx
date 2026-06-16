import { Outlet, NavLink } from 'react-router-dom'
import { Sword, Users, GitCompare, Package, Home } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/characters', icon: Sword, label: 'Characters' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/party', icon: Users, label: 'Party' },
  { to: '/homebrew', icon: Package, label: 'Homebrew' },
] as const

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <header className="border-b sticky top-0 z-50 backdrop-blur" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">⚔️ DnD Builder</span>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'opacity-60 hover:opacity-100',
                  ].join(' ')
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t flex"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              ['flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors', isActive ? 'text-primary' : 'opacity-50'].join(' ')
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
