import { useState, type FormEvent } from 'react'
import { Mail, User } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AuthShell, { AuthHead, FormError, OrRule } from '../components/auth/AuthShell'
import {
  Checkbox,
  GoogleButton,
  PasswordField,
  PrimaryButton,
  Strength,
  TextField,
  emailOk,
  linkClass,
} from '../components/auth/fields'
import { supabase } from '../lib/supabase'
import type { LoginState } from './Login'

export default function Signup() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [d, setD] = useState({ name: '', email: '', pw: '', agree: false })
  const [err, setErr] = useState<{ name?: string; email?: string; pw?: string; agree?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    const er: typeof err = {}
    if (!d.name.trim()) er.name = 'Add your name so we know what to call you.'
    if (!emailOk(d.email)) er.email = 'Enter a valid email, like name@example.com.'
    if (d.pw.length < 8) er.pw = 'Use at least 8 characters.'
    if (!d.agree) er.agree = 'Please accept the terms to continue.'
    setErr(er)
    if (Object.keys(er).length) return

    setBusy(true)
    const email = d.email.trim()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: d.pw,
      // full_name is copied into profiles by the handle_new_user trigger.
      options: { data: { full_name: d.name.trim().replace(/\s+/g, ' ') }, emailRedirectTo: `${window.location.origin}/` },
    })
    setBusy(false)
    if (error) {
      if (error.code === 'user_already_exists')
        setErr({ form: 'An account with this email already exists. Log in instead, or reset your password.' })
      else if (error.code === 'weak_password') setErr({ pw: error.message })
      else setErr({ form: error.message })
      return
    }
    // With "Confirm email" off, Supabase signs the user in straight away.
    if (data.session) return navigate('/', { replace: true })
    // Otherwise they confirm by email first.
    navigate('/login', {
      state: {
        email,
        banner: { tone: 'info', text: `Check ${email} for a link to confirm your account, then log in.` },
      } satisfies LoginState,
    })
  }

  return (
    <AuthShell>
      <AuthHead title="Create your account" sub="Free while you search. Takes about a minute." />
      <GoogleButton onError={(m) => setErr({ form: m })}>Sign up with Google</GoogleButton>
      <OrRule />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {err.form && <FormError>{err.form}</FormError>}
        <TextField
          id="su-name"
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="e.g. Ada Okafor"
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
          error={err.name}
          autoFocus
        />
        <TextField
          id="su-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="name@example.com"
          value={d.email}
          onChange={(e) => setD({ ...d, email: e.target.value })}
          error={err.email}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id="su-pw"
            label="Password"
            autoComplete="new-password"
            value={d.pw}
            onChange={(e) => setD({ ...d, pw: e.target.value })}
            error={err.pw}
          />
          {!err.pw && <Strength value={d.pw} />}
        </div>
        <div className="flex flex-col gap-1">
          <Checkbox id="su-agree" checked={d.agree} onChange={(agree) => setD({ ...d, agree })}>
            {/* Terms and Privacy pages come with roadmap item 7.3. */}
            <span className="text-sm text-ink-700">
              I agree to the <span className="font-semibold text-blue-600">Terms</span> and{' '}
              <span className="font-semibold text-blue-600">Privacy Policy</span>
            </span>
          </Checkbox>
          {err.agree && <span className="pl-[30px] text-xs text-coral-700">{err.agree}</span>}
        </div>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
        </PrimaryButton>
      </form>
      <p className="text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
