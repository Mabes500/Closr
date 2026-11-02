import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from '../components/Logo'

export default function Login() {
  const { session, loading, authError } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return null
  // Already signed in: / shows the board.
  if (session) return <Navigate to="/" replace />

  // Return to the app root after Google or the email link; for a signed-in user that is the board.
  // This URL must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
  const redirectTo = `${window.location.origin}/`

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size={32} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Track every application in one place.</p>

          {sent ? (
            <p className="mt-6 rounded-lg bg-brand-soft p-3 text-sm text-ink">
              Check <span className="font-medium">{email}</span> for a sign-in link.
            </p>
          ) : (
            <>
              <button
                onClick={google}
                className="mt-6 w-full rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium hover:bg-canvas"
              >
                Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-ink-faint">
                <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
              </div>
              <form onSubmit={sendLink} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <button
                  disabled={busy}
                  className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  {busy ? 'Sending…' : 'Email me a sign-in link'}
                </button>
              </form>
            </>
          )}
          {(error ?? authError) && (
            <p className="mt-3 text-sm text-status-rejected">
              {error ?? `Sign-in didn't complete: ${authError}. Please try again.`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
