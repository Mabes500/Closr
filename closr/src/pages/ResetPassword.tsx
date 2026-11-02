import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AuthShell, { AuthHead, FormError } from '../components/auth/AuthShell'
import { PasswordField, PrimaryButton, Strength } from '../components/auth/fields'
import { supabase } from '../lib/supabase'
import type { LoginState } from './Login'

// Opened from the reset email: Supabase signs the user in with a recovery session first.
export default function ResetPassword() {
  const { session, loading, authError } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<{ pw?: string; pw2?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (loading) return null

  // No session means the link was expired, already used, or the page was opened directly
  // (or we just signed out after updating, and are on the way to /login).
  if (!session && done) return null
  if (!session)
    return (
      <AuthShell>
        <AuthHead
          title="This reset link has expired"
          sub="Reset links work once and only for a short time. Ask for a new one and use it straight away."
        />
        {authError && <FormError>{authError}</FormError>}
        <PrimaryButton onClick={() => navigate('/forgot')}>Send a new link</PrimaryButton>
      </AuthShell>
    )

  const email = session.user.email

  async function submit(e: FormEvent) {
    e.preventDefault()
    const er: typeof err = {}
    if (pw.length < 8) er.pw = 'Use at least 8 characters.'
    else if (pw !== pw2) er.pw2 = "These don't match yet. Type the same password twice."
    setErr(er)
    if (Object.keys(er).length) return

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) {
      setBusy(false)
      if (error.code === 'same_password') return setErr({ pw: 'Choose a password you haven\'t used on this account before.' })
      if (error.code === 'weak_password') return setErr({ pw: error.message })
      return setErr({ form: error.message })
    }
    // As the screen promises: sign out everywhere, then log in again with the new password.
    setDone(true)
    await supabase.auth.signOut({ scope: 'global' })
    navigate('/login', {
      replace: true,
      state: {
        email,
        banner: { tone: 'success', text: 'Password updated. Log in with your new password.' },
      } satisfies LoginState,
    })
  }

  return (
    <AuthShell>
      <AuthHead
        title="Set a new password"
        sub={
          <>
            For <b className="text-ink">{email || 'your account'}</b>. You'll be signed out on other devices.
          </>
        }
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {err.form && <FormError>{err.form}</FormError>}
        <div className="flex flex-col gap-2">
          <PasswordField
            id="rs-pw"
            label="New password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            error={err.pw}
            autoFocus
          />
          {!err.pw && <Strength value={pw} />}
        </div>
        <PasswordField
          id="rs-pw2"
          label="Confirm new password"
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          error={err.pw2}
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </PrimaryButton>
      </form>
    </AuthShell>
  )
}
