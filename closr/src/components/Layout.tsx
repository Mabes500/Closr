import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from './Logo'

const nav = [
  { to: '/', label: 'Board', end: true },
  // Upcoming: { to: '/goals', label: 'Goals' }, { to: '/interviews', label: 'Interviews' }, { to: '/contacts', label: 'Contacts' }
]

export default function Layout() {
  const { session, signOut } = useAuth()
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-8">
          <Logo size={24} />
          <nav className="flex gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:text-ink'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink-muted sm:inline">{session?.user.email}</span>
          <button onClick={signOut} className="text-ink-muted hover:text-ink">
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
