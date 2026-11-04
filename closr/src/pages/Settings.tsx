import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, KeyRound, LogOut, Mail, Monitor, Moon, Sun, Trash2, User } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import AutosaveInput from '../components/AutosaveInput'
import { PasswordField, Strength, emailOk, linkClass } from '../components/auth/fields'
import { Badge, Button, Card, Dialog, Input, Select, Switch, Tabs, Toast, TopBar } from '../components/ui'
import { downloadMyData } from '../lib/exportData'
import { useProfile, useUpdateProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'
import { applyTheme, type Theme } from '../lib/theme'
import { NOTIFICATION_PREFS, type Profile } from '../lib/types'

type Section = 'account' | 'notifications' | 'preferences' | 'privacy'
type Notify = (title: string) => void

const redirect = (path: string) => `${window.location.origin}${path}`

// Prototype `SettingsScreen`. Everything saves as you change it.
export default function Settings() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const [section, setSection] = useState<Section>('account')
  const [toast, setToast] = useState<string | null>(null)

  if (isLoading) return null
  if (!profile) return <p className="text-sm text-coral-700">Your settings couldn't be loaded. Try reloading the page.</p>
  const save = (patch: Partial<Profile>) => update.mutate(patch)

  return (
    <div className="flex max-w-[860px] flex-col gap-[18px]">
      <TopBar title="Settings" />
      <div className="overflow-x-auto">
        <Tabs
          value={section}
          onChange={setSection}
          items={[
            { value: 'account', label: 'Account' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'preferences', label: 'Preferences' },
            { value: 'privacy', label: 'Privacy and data' },
          ]}
        />
      </div>
      {update.error && <p className="text-sm text-coral-700">Couldn't save that: {update.error.message}</p>}
      {section === 'account' && <Account profile={profile} save={save} notify={setToast} />}
      {section === 'notifications' && <Notifications profile={profile} save={save} />}
      {section === 'preferences' && <Appearance theme={profile.theme} save={save} />}
      {section === 'privacy' && <Privacy notify={setToast} />}
      {toast && <Toast icon={Check} title={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function Panel({ title, sub, right, children }: { title: string; sub?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-[1_1_240px] flex-col gap-1">
          <h2 className="text-lg font-semibold leading-[1.3] tracking-[-0.02em] text-ink">{title}</h2>
          {sub && <p className="text-sm leading-[1.45] text-ink-500">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  )
}

function Row({ label, sub, first, children }: { label: ReactNode; sub?: ReactNode; first?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 py-3 ${first ? '' : 'border-t border-paper-200'}`}>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
        <span className="text-sm font-semibold leading-[1.3] text-ink">{label}</span>
        {sub && <span className="text-[13px] leading-[1.4] text-ink-500 [overflow-wrap:anywhere]">{sub}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

const Problem = ({ children }: { children: ReactNode }) => (children ? <p className="text-sm text-coral-700">{children}</p> : null)

// ---------------------------------------------------------------------------
// Account: details, password, sign-in methods, sessions
// ---------------------------------------------------------------------------
function Account({ profile, save, notify }: { profile: Profile; save: (p: Partial<Profile>) => void; notify: Notify }) {
  const qc = useQueryClient()
  const { session } = useAuth()
  const user = session?.user
  const meta = user?.user_metadata ?? {}
  const { data: hasPassword } = useQuery({
    queryKey: ['has_password', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_password')
      if (error) throw error
      return data as boolean
    },
  })
  const { data: identities = [], isLoading: loadingMethods } = useQuery({
    queryKey: ['identities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities()
      if (error) throw error
      return data.identities
    },
  })
  const google = identities.find((i) => i.provider === 'google')

  // Details
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState('')
  const changed = email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()
  async function changeEmail() {
    setEmailBusy(true)
    setEmailError('')
    const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: redirect('/settings') })
    setEmailBusy(false)
    if (error) return setEmailError(error.code === 'email_exists' ? 'That email is already used by another account.' : error.message)
    notify(`Confirmation link sent to ${email.trim()}.`)
  }

  // Password
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ cur: '', next: '', conf: '' })
  const [pwErr, setPwErr] = useState<{ cur?: string; next?: string; conf?: string; form?: string }>({})
  const [pwBusy, setPwBusy] = useState(false)
  const closePw = () => {
    setPwOpen(false)
    setPw({ cur: '', next: '', conf: '' })
    setPwErr({})
  }
  async function savePassword() {
    const er: typeof pwErr = {}
    if (hasPassword && !pw.cur) er.cur = 'Enter your current password.'
    if (pw.next.length < 8) er.next = 'Use at least 8 characters.'
    else if (pw.next !== pw.conf) er.conf = "These don't match yet."
    setPwErr(er)
    if (Object.keys(er).length || !user?.email) return
    setPwBusy(true)
    try {
      if (hasPassword) {
        // Logging in with it is how Supabase confirms the current password.
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.cur })
        if (error) return setPwErr(error.code === 'invalid_credentials' ? { cur: "That isn't your current password." } : { form: error.message })
      }
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      if (error) {
        if (error.code === 'same_password') return setPwErr({ next: 'Pick a different password from your current one.' })
        if (error.code === 'reauthentication_needed') return setPwErr({ form: 'For security, sign out and log back in, then try again.' })
        return setPwErr({ form: error.message })
      }
      notify(hasPassword ? 'Password updated. Other devices stay signed in.' : 'Password set. You can also log in with your email now.')
      closePw()
      qc.invalidateQueries({ queryKey: ['has_password'] })
    } finally {
      setPwBusy(false)
    }
  }
  async function forgotPassword() {
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: redirect('/reset') })
    if (error) setPwErr({ form: error.message })
    else notify(`Reset link sent to ${user.email}.`)
  }

  // Sign-in methods. Coming back from a failed Google link, Supabase puts the reason in the address.
  const [methodError, setMethodError] = useState('')
  const [methodBusy, setMethodBusy] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`)
    const why = params.get('error_description')
    if (!why) return
    setMethodError(/already/i.test(why) ? 'That Google account is already linked to another Closr account.' : why.replace(/\+/g, ' '))
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])
  async function connectGoogle() {
    setMethodBusy(true)
    setMethodError('')
    const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: redirect('/settings') } })
    if (error) {
      setMethodBusy(false)
      setMethodError(error.code === 'manual_linking_disabled' ? "Connecting Google isn't turned on yet." : error.message)
    }
  }
  // Never remove the last way in: Google can only go when a password and another linked
  // method remain (Supabase itself refuses to remove someone's only linked identity).
  const blocked = !hasPassword ? 'Set a password first, so you can still log in.' : identities.length < 2 ? "Google is the only sign-in linked to this account, so it can't be removed." : ''
  async function disconnectGoogle() {
    if (!google || blocked) return
    setMethodBusy(true)
    setMethodError('')
    const { error } = await supabase.auth.unlinkIdentity(google)
    setMethodBusy(false)
    if (error) return setMethodError(error.code === 'single_identity_not_deletable' ? "Google is the only sign-in linked to this account, so it can't be removed." : error.message)
    await supabase.auth.refreshSession()
    qc.invalidateQueries({ queryKey: ['identities'] })
    notify('Google disconnected. Use your email and password to log in.')
  }

  // Sessions
  const [sessionError, setSessionError] = useState('')
  async function signOutOthers() {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) setSessionError(error.message)
    else notify('Signed out of your other devices.')
  }

  return (
    <>
      <Panel title="Your details" sub="Your name shows on your profile. Your email is how you log in.">
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <AutosaveInput id="set-name" label="Name" icon={User} saved={profile.full_name || meta.full_name || meta.name || ''} onSave={(v) => save({ full_name: v.trim() || null })} />
          <Input
            id="set-email"
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint={changed ? "We'll send a link to the new address. Your login changes once you confirm it." : undefined}
          />
        </div>
        {changed && emailOk(email) && (
          <div>
            <Button size="sm" disabled={emailBusy} onClick={changeEmail}>
              {emailBusy ? 'Sending…' : 'Send confirmation link'}
            </Button>
          </div>
        )}
        {user?.new_email && !changed && (
          <p className="text-[13px] text-ink-500">
            Waiting for you to confirm <b className="font-semibold text-ink">{user.new_email}</b>. Open the link we emailed.
          </p>
        )}
        <Problem>{emailError}</Problem>
      </Panel>

      <Panel
        title="Password"
        sub={pwOpen ? "Pick something you don't use anywhere else." : hasPassword === false ? 'You log in with Google. Add a password to also log in with your email.' : 'Used to log in with your email.'}
        right={
          !pwOpen && (
            <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => setPwOpen(true)}>
              {hasPassword === false ? 'Set a password' : 'Change password'}
            </Button>
          )
        }
      >
        {pwOpen && (
          <div className="flex max-w-[420px] flex-col gap-3.5">
            {hasPassword && (
              <PasswordField id="cp-cur" label="Current password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} error={pwErr.cur} autoFocus />
            )}
            <div className="flex flex-col gap-2">
              <PasswordField id="cp-new" label="New password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErr.next} />
              {!pwErr.next && <Strength value={pw.next} />}
            </div>
            <PasswordField id="cp-conf" label="Confirm new password" autoComplete="new-password" value={pw.conf} onChange={(e) => setPw({ ...pw, conf: e.target.value })} error={pwErr.conf} />
            <Problem>{pwErr.form}</Problem>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={pwBusy} onClick={savePassword}>
                {pwBusy ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
              </Button>
              <Button variant="ghost" onClick={closePw}>
                Cancel
              </Button>
              {hasPassword && (
                <button type="button" onClick={forgotPassword} className={`text-[13px] ${linkClass}`}>
                  Forgot your current password?
                </button>
              )}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Sign-in methods">
        <div>
          <Row first label="Email and password" sub={user?.email}>
            {hasPassword ? <Badge className="bg-oxford-50 text-brand-ink">Set up</Badge> : hasPassword === false ? <Badge>Not set up</Badge> : null}
          </Row>
          <Row label="Google" sub={google ? (google.identity_data?.email ? `Connected as ${google.identity_data.email}` : 'Connected') : 'Log in with one click'}>
            {loadingMethods ? null : google ? (
              <Button size="sm" variant="ghost" disabled={methodBusy || !!blocked} title={blocked || undefined} onClick={disconnectGoogle}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={methodBusy} onClick={connectGoogle}>
                Connect
              </Button>
            )}
          </Row>
        </div>
        {google && blocked && <p className="text-[13px] text-ink-500">{blocked}</p>}
        <Problem>{methodError}</Problem>
      </Panel>

      <Panel title="Where you're signed in" sub="Sign out anywhere you don't recognise.">
        <Row
          first
          label={
            <span className="inline-flex items-center gap-2">
              <Monitor size={16} className="text-ink-500" />
              This browser
              <Badge className="bg-mint-100 text-mint-700">This device</Badge>
            </span>
          }
          sub="Other devices can't be listed here, but you can sign them all out."
        />
        <div className="flex flex-wrap gap-2 border-t border-paper-200 pt-4">
          <Button variant="secondary" size="sm" icon={LogOut} onClick={() => supabase.auth.signOut({ scope: 'local' })}>
            Sign out of this device
          </Button>
          <Button variant="secondary" size="sm" onClick={signOutOthers}>
            Sign out other devices
          </Button>
        </div>
        <Problem>{sessionError}</Problem>
      </Panel>
    </>
  )
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const hours = (xs: string[]) => xs.map((t) => ({ value: t, label: t }))
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ value: d, label: d }))

function Notifications({ profile, save }: { profile: Profile; save: (p: Partial<Profile>) => void }) {
  const prefs = profile.notification_prefs
  return (
    <>
      <Panel title="What we tell you about" sub="Choose what shows in Closr and what should also reach your inbox.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr>
                {['', 'In Closr', 'Email'].map((h) => (
                  <th key={h} className={`px-2 pb-2.5 text-xs font-semibold text-ink-500 ${h ? 'w-[84px] text-center' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_PREFS.map((p) => (
                <tr key={p.id} className="border-t border-paper-200">
                  <td className="py-3 pl-0 pr-2">
                    <div className="text-sm font-semibold leading-[1.3] text-ink">{p.label}</div>
                    <div className="text-[13px] leading-[1.4] text-ink-500">{p.sub}</div>
                  </td>
                  {(['app', 'email'] as const).map((ch) => (
                    <td key={ch} className="text-center">
                      <Switch
                        id={`np-${p.id}-${ch}`}
                        label=""
                        ariaLabel={`${p.label}: ${ch === 'app' ? 'In Closr' : 'Email'}`}
                        checked={prefs[p.id]?.[ch] ?? false}
                        onChange={(v) => save({ notification_prefs: { ...prefs, [p.id]: { ...prefs[p.id], [ch]: v } } })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Timing">
        <div>
          <Row first label="Quiet hours" sub="Hold email notifications overnight. Interview reminders still come through.">
            <Switch id="set-quiet" label="" ariaLabel="Quiet hours" checked={profile.quiet_hours} onChange={(v) => save({ quiet_hours: v })} />
          </Row>
          {profile.quiet_hours && (
            <div className="flex flex-wrap items-end gap-2.5 pb-3">
              <Select id="set-qfrom" selectSize="sm" label="From" value={profile.quiet_from} onChange={(e) => save({ quiet_from: e.target.value })} options={hours(['20:00', '21:00', '22:00', '23:00'])} wrapClassName="w-[120px]" />
              <Select id="set-qto" selectSize="sm" label="Until" value={profile.quiet_to} onChange={(e) => save({ quiet_to: e.target.value })} options={hours(['06:00', '07:00', '08:00', '09:00'])} wrapClassName="w-[120px]" />
            </div>
          )}
          <Row label="Weekly check-in" sub="When we ask how your quiet applications are going.">
            <Select id="set-ciday" selectSize="sm" aria-label="Check-in day" value={profile.checkin_day} onChange={(e) => save({ checkin_day: e.target.value })} options={DAYS} wrapClassName="w-[140px]" />
            <Select id="set-citime" selectSize="sm" aria-label="Check-in time" value={profile.checkin_time} onChange={(e) => save({ checkin_time: e.target.value })} options={hours(['08:00', '09:00', '12:00', '17:00', '19:00'])} wrapClassName="w-[100px]" />
          </Row>
          <Row label="Suggest follow-ups" sub="Offer a follow-up reminder when you mark a job Applied or answer “No reply yet”.">
            <Switch id="set-autofu" label="" ariaLabel="Suggest follow-ups" checked={profile.suggest_follow_ups} onChange={(v) => save({ suggest_follow_ups: v })} />
          </Row>
        </div>
      </Panel>
    </>
  )
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------
const THEMES: { value: Theme; label: string; icon: typeof Sun; swatches: string[] }[] = [
  { value: 'light', label: 'Light', icon: Sun, swatches: ['light'] },
  { value: 'dark', label: 'Dark', icon: Moon, swatches: ['dark'] },
  { value: 'system', label: 'Match device', icon: Monitor, swatches: ['light', 'dark'] },
]

function Appearance({ theme, save }: { theme: Theme; save: (p: Partial<Profile>) => void }) {
  return (
    <Panel title="Appearance">
      <div role="radiogroup" aria-label="Theme" className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {THEMES.map(({ value, label, icon: Icon, swatches }) => {
          const on = theme === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                applyTheme(value)
                save({ theme: value })
              }}
              className={`flex flex-col gap-2.5 rounded-xl border-[1.5px] p-3 text-left transition-colors ${on ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_3px_var(--color-focus)]' : 'border-paper-200 bg-surface hover:border-ink-300'}`}
            >
              {/* A little picture of each theme, so it always shows its own colours. */}
              <span aria-hidden="true" className="flex h-16 overflow-hidden rounded-[10px] border border-paper-200">
                {swatches.map((s) => (
                  <span key={s} className={`flex flex-1 items-end gap-1 p-2 ${s === 'dark' ? 'theme-swatch-dark' : 'theme-swatch-light'}`}>
                    <i className="theme-swatch-bar h-1.5 w-[18px] rounded" />
                    <i className="theme-swatch-dot size-1.5 rounded-full" />
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon size={16} className="text-ink-500" />
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Privacy and data
// ---------------------------------------------------------------------------
function Privacy({ notify }: { notify: Notify }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  async function exportData() {
    setBusy(true)
    setError('')
    try {
      const { jobs, reminders } = await downloadMyData()
      notify(`Downloaded ${jobs} job${jobs === 1 ? '' : 's'} and ${reminders} reminder${reminders === 1 ? '' : 's'}.`)
    } catch (e) {
      setError(`Couldn't export your data: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Panel title="Your data" sub="Download your jobs, reminders and notes as one CSV file, right away.">
        <div>
          <Button variant="secondary" icon={Download} disabled={busy} onClick={exportData}>
            {busy ? 'Preparing…' : 'Export my data'}
          </Button>
        </div>
        <Problem>{error}</Problem>
      </Panel>
      <Card className="flex flex-wrap items-center gap-4 border-coral-100 p-6">
        <div className="flex flex-[1_1_260px] flex-col gap-1">
          <h2 className="text-lg font-semibold leading-[1.3] tracking-[-0.02em] text-coral-700">Delete account</h2>
          <p className="text-sm leading-[1.45] text-ink-500">Permanently remove your account and everything in it.</p>
        </div>
        <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)}>
          Delete account
        </Button>
      </Card>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </>
  )
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { session } = useAuth()
  const email = session?.user.email ?? ''
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const matches = !!email && typed.trim().toLowerCase() === email.toLowerCase()

  async function destroy() {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: typed }),
      })
      const body = await r.json().catch(() => null)
      if (!r.ok) throw new Error(body?.error ?? 'Your account couldn’t be deleted. Please try again.')
    } catch (e) {
      setBusy(false)
      return setError((e as Error).message)
    }
    // Gone on the server: clear this browser and go back to the start.
    for (const k of Object.keys(localStorage)) if (k.startsWith('closr-')) localStorage.removeItem(k)
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    window.location.replace('/')
  }

  return (
    <Dialog
      title="Delete your account?"
      description={`This permanently deletes your board, notes, reminders and CV labels for ${email}. It cannot be undone.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep my account
          </Button>
          <Button variant="danger" icon={Trash2} disabled={!matches || busy} onClick={destroy}>
            {busy ? 'Deleting…' : 'Delete account'}
          </Button>
        </>
      }
    >
      <Input id="del-email" label="Type your email to confirm" type="email" autoComplete="off" placeholder={email} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
      <Problem>{error}</Problem>
    </Dialog>
  )
}
