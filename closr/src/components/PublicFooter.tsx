import { Link } from 'react-router-dom'
import { LEGAL } from '../lib/legal'
import { Mark } from './Logo'

// Footer for the pages anyone can see without signing in.
export default function PublicFooter() {
  return (
    <footer className="border-t border-paper-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6 text-sm text-ink-500">
        <span className="inline-flex items-center gap-2">
          <Mark size={18} /> © {new Date().getFullYear()} Closr
        </span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/blog" className="hover:text-ink">
            Blog
          </Link>
          <Link to="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-ink">
            Terms
          </Link>
          <a href={`mailto:${LEGAL.contactEmail}`} className="hover:text-ink">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
