import { useEffect, useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AuthShell, { AuthHead, FormError } from '../components/auth/AuthShell'
import { BackLink, PrimaryButton, TextField, emailOk, linkClass } from '../components/auth/fields'
import { supabase } from '../lib/supabase'

type EmailState = { email?: string }

// Supabase only allows one reset email per address per 60 seconds, so "Resend" waits that long.
const RESEND_WAIT = 60

// The emailed link opens /reset signed in with a one-time recovery session.
// /reset must be covered by Supabase → Authentication → URL Configuration → Redirect URLs.
function sendResetEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` })
}

export function ForgotPassword() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as EmailState
  const [email, setEmail] = useState(state.email ?? '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!emailOk(email)) return setErr('Enter the email on your account, like name@example.com.')
    setBusy(true)
    const { error } = await sendResetEmail(email.trim())
    setBusy(false)
    if (error) return setErr(error.message)
    navigate('/forgot/sent', { state: { email: email.trim() } satisfies EmailState })
  }

  return (
    <AuthShell>
      <BackLink to="/login" state={{ email }}>
        Back to log in
      </BackLink>
      <AuthHead title="Reset your password" sub="Enter the email on your account. We'll send a link to set a new password." />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          id="fp-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err}
          autoFocus
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </PrimaryButton>
      </form>
    </AuthShell>
  )
}

export function ResetSent() {
  const { email } = (useLocation().state ?? {}) as EmailState
  const [wait, setWait] = useState(RESEND_WAIT)
  const [sentAgain, setSentAgain] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Reached directly (e.g. after a reload) there's no email to show, so start again.
  if (!email) return <Navigate to="/forgot" replace />

  async function resend() {
    setErr('')
    const { error } = await sendResetEmail(email!)
    if (error) return setErr(error.message)
    setWait(RESEND_WAIT)
    setSentAgain(true)
  }

  return (
    <AuthShell>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-100">
        <Mail size={28} className="text-blue-600" />
      </div>
      <AuthHead
        title="Check your email"
        sub={
          <>
            We sent a reset link to <b className="text-ink">{email}</b>. It expires in 30 minutes.
          </>
        }
      />
      <div className="rounded-xl bg-paper-100 p-3">
        <ul className="flex list-disc flex-col gap-1 pl-[18px] text-sm leading-normal text-ink-700">
          <li>Not there after a minute? Check spam or promotions.</li>
          <li>Signed up with Google? Log in with Google instead.</li>
        </ul>
      </div>
      {err && <FormError>{err}</FormError>}
      <div className="flex flex-wrap justify-between gap-3 text-sm font-medium text-ink-500">
        {wait > 0 ? (
          <span>
            Resend in{' '}
            <span className="font-mono">
              {Math.floor(wait / 60)}:{String(wait % 60).padStart(2, '0')}
            </span>
          </span>
        ) : (
          <button type="button" onClick={resend} className={linkClass}>
            {sentAgain ? 'Resend again' : 'Resend email'}
          </button>
        )}
        <Link to="/forgot" state={{ email }} className={linkClass}>
          Use a different email
        </Link>
      </div>
    </AuthShell>
  )
}
