import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AuthShell, { AuthHead, FormError, OrRule, type Banner } from '../components/auth/AuthShell'
import { GoogleButton, PasswordField, PrimaryButton, TextField, emailOk, linkClass } from '../components/auth/fields'
import { supabase } from '../lib/supabase'

// Other auth screens can pass a prefilled email and a banner (e.g. after a password reset).
export type LoginState = { email?: string; banner?: Banner }

export default function Login() {
  const { session, loading, authError } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as LoginState
  const [email, setEmail] = useState(state.email ?? '')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<{ email?: string; pw?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (loading) return null
  // Already signed in: / shows the board.
  if (session) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    const er: typeof err = {}
    if (!emailOk(email)) er.email = 'Enter the email you signed up with, like name@example.com.'
    if (!pw) er.pw = 'Enter your password.'
    setErr(er)
    if (Object.keys(er).length) return

    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    setBusy(false)
    if (!error) return navigate('/', { replace: true })
    if (error.code === 'invalid_credentials')
      setErr({ form: "That email and password don't match. Check for typos or reset your password." })
    else if (error.code === 'email_not_confirmed')
      setErr({ form: 'Confirm your email first. Check your inbox for the link we sent when you signed up.' })
    else setErr({ form: error.message })
  }

  const formError = err.form ?? (authError && `Sign-in didn't complete: ${authError}. Please try again.`)

  return (
    <AuthShell banner={state.banner}>
      <AuthHead title="Welcome back" sub="Log in to pick up where you left off." />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <FormError>{formError}</FormError>}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={err.email}
          autoFocus={!email}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id="login-pw"
            label="Password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            error={err.pw}
            autoFocus={!!email}
          />
          <Link to="/forgot" state={{ email }} className={`self-end text-[13px] ${linkClass}`}>
            Forgot password?
          </Link>
        </div>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </PrimaryButton>
      </form>
      <OrRule />
      <GoogleButton onError={(m) => setErr({ form: m })}>Continue with Google</GoogleButton>
      <p className="text-center text-sm text-ink-500">
        New to Closr?{' '}
        <Link to="/signup" className={linkClass}>
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
