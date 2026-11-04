import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from './Logo'

// Header for the pages anyone can see without signing in.
export default function PublicHeader() {
  const { session } = useAuth()
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-5">
      <Link to="/" aria-label="Closr home">
        <Logo size={26} />
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/blog" className="font-semibold text-ink-700 hover:text-ink">
          Blog
        </Link>
        {session ? (
          <Link to="/" className="rounded-xl bg-action px-4 py-2 font-semibold text-on-action hover:bg-action-hover">
            Open Closr
          </Link>
        ) : (
          <>
            <Link to="/login" className="font-semibold text-ink-700 hover:text-ink">
              Log in
            </Link>
            <Link to="/signup" className="whitespace-nowrap rounded-xl bg-action px-4 py-2 font-semibold text-on-action hover:bg-action-hover">
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
