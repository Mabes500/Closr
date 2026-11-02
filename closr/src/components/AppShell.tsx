import { useEffect, useState, type ReactNode } from 'react'
import {
  Briefcase,
  CalendarCheck,
  CalendarClock,
  ChevronsUpDown,
  FileText,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Target,
  Upload,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useApplications } from '../lib/applications'
import { useProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'
import { Checkbox } from './auth/fields'
import { Logo } from './Logo'
import { Avatar, Button, Dialog, IconButton } from './ui'

// App shell from docs/prototype.html (AppShell, Sidebar, NAV): fixed sidebar on wide
// screens; below 861px a top bar with a menu button that slides the sidebar in.
// Left out until their features exist: notification bell (3.3), streak card (5.1),
// dark-mode toggle (7.1).

export const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Board', icon: LayoutGrid },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/checkins', label: 'Check-ins', icon: CalendarCheck },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/cv', label: 'CV Versions', icon: FileText },
  { to: '/import', label: 'Spreadsheet Import', icon: Upload },
]

function useIsNarrow() {
  const query = '(max-width: 860px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const f = () => setNarrow(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return narrow
}

export default function AppShell() {
  const narrow = useIsNarrow()
  const { pathname } = useLocation()
  const [side, setSide] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Close the mobile menu whenever the page changes.
  useEffect(() => setSide(false), [pathname])

  const sidebar = <Sidebar onClose={narrow ? () => setSide(false) : undefined} onSignOut={() => setSigningOut(true)} />

  return (
    <div className="flex min-h-screen bg-paper-50">
      {!narrow && sidebar}
      {narrow && (
        <header className="fixed inset-x-0 top-0 z-[80] flex h-[calc(60px+env(safe-area-inset-top))] items-center gap-1.5 border-b border-paper-200 bg-white pl-[max(10px,env(safe-area-inset-left))] pr-[max(10px,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
          <IconButton icon={MenuIcon} label="Open menu" onClick={() => setSide(true)} />
          <span className="flex-1">
            <Logo size={24} />
          </span>
        </header>
      )}
      {narrow && side && (
        <div onClick={() => setSide(false)} className="fixed inset-0 z-[120] bg-overlay">
          <div onClick={(e) => e.stopPropagation()} className="h-full w-[min(248px,86vw)] animate-[sb-in_220ms_cubic-bezier(.2,.8,.2,1)]">
            {sidebar}
          </div>
        </div>
      )}
      <main className="flex min-w-0 flex-1 flex-col px-[max(16px,env(safe-area-inset-left))] pb-24 pt-[calc(80px+env(safe-area-inset-top))] min-[861px]:px-8 min-[861px]:pb-10 min-[861px]:pt-7">
        <Outlet />
      </main>
      {signingOut && <SignOutDialog onClose={() => setSigningOut(false)} />}
    </div>
  )
}

function Sidebar({ onClose, onSignOut }: { onClose?: () => void; onSignOut: () => void }) {
  const { session } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data: apps = [] } = useApplications()
  const { data: profile } = useProfile()
  const [menu, setMenu] = useState(false)

  const meta = session?.user.user_metadata ?? {}
  const email = session?.user.email ?? ''
  const name: string = profile?.full_name || meta.full_name || meta.name || email.split('@')[0] || 'You'
  const current = pathname
  const counts: Record<string, number> = { '/': apps.filter((a) => a.status !== 'closed').length }
  const inAccount = pathname === '/profile' || pathname === '/settings'

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-paper-200 bg-white px-3.5 py-[22px]">
      <div className="flex items-center gap-1 pl-2">
        <span className="flex-1">
          <Logo size={28} />
        </span>
        {onClose && <IconButton icon={X} label="Close menu" onClick={onClose} />}
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const on = current === to
          const n = counts[to]
          return (
            // A plain Link: NavLink would set its own aria-current (and match "/" everywhere).
            <Link
              key={to}
              to={to}
              aria-current={on ? 'page' : undefined}
              className={`flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm leading-none transition-colors ${
                on ? 'bg-oxford-50 font-semibold text-oxford-900' : 'font-medium text-ink-700 hover:bg-paper-100'
              }`}
            >
              <Icon size={18} className={on ? 'text-blue-600' : 'text-ink-500'} />
              <span className="flex-1">{label}</span>
              {n ? (
                <span
                  className={`rounded-full px-[7px] py-1 text-[11px] font-semibold leading-none ${on ? 'bg-blue-100 text-blue-700' : 'bg-paper-200 text-ink-500'}`}
                >
                  {n}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="relative mt-auto flex items-center gap-1.5 pt-4">
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-haspopup="menu"
          aria-expanded={menu}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-paper-100 ${inAccount ? 'bg-oxford-50' : ''}`}
        >
          <Avatar name={name} />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
            <span className="truncate text-[13px] font-semibold leading-[1.1] text-ink">{name}</span>
            <span className="truncate text-xs leading-[1.1] text-ink-500">{profile?.target_roles[0] || 'Your profile'}</span>
          </div>
          <ChevronsUpDown size={15} className="text-ink-400" />
        </button>
        {menu && (
          <Menu onClose={() => setMenu(false)}>
            <div className="flex flex-col gap-0.5 px-2.5 pb-1.5 pt-2">
              <b className="text-sm font-semibold text-ink">{name}</b>
              <span className="text-xs text-ink-500 [overflow-wrap:anywhere]">{email}</span>
            </div>
            <MenuRule />
            <MenuItem icon={User} label="Profile" onClick={() => navigate('/profile')} />
            <MenuItem icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
            <MenuRule />
            <MenuItem icon={LogOut} label="Sign out" onClick={onSignOut} />
          </Menu>
        )}
      </div>
    </aside>
  )
}

function Menu({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[140]" />
      {/* Items close the menu as they act. */}
      <div
        role="menu"
        onClick={onClose}
        className="absolute inset-x-0 bottom-14 z-[150] flex min-w-[210px] flex-col rounded-[14px] border border-paper-200 bg-white p-1.5 shadow-dialog"
      >
        {children}
      </div>
    </>
  )
}

function MenuRule() {
  return <div className="mx-1 my-1.5 h-px bg-paper-200" />
}

function MenuItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className="flex h-[38px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium text-ink hover:bg-paper-100"
    >
      <Icon size={16} className="text-ink-500" />
      <span className="flex-1">{label}</span>
    </button>
  )
}

// Prototype `SignOutDialog`. "Other devices" signs out every session for this account.
function SignOutDialog({ onClose }: { onClose: () => void }) {
  const { session } = useAuth()
  const [all, setAll] = useState(false)
  const [busy, setBusy] = useState(false)
  async function signOut() {
    setBusy(true)
    await supabase.auth.signOut({ scope: all ? 'global' : 'local' })
  }
  return (
    <Dialog
      title="Sign out of Closr?"
      description={`Your board stays saved. Log back in any time with ${session?.user.email ?? 'your email'}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={LogOut} onClick={signOut} disabled={busy}>
            Sign out
          </Button>
        </>
      }
    >
      <Checkbox id="so-all" checked={all} onChange={setAll}>
        <span className="block">Also sign out on my other devices</span>
        <span className="block text-[13px] text-ink-500">Use this if you logged in on a shared or lost device.</span>
      </Checkbox>
    </Dialog>
  )
}
