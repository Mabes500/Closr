import { useState, type ReactNode } from 'react'
import { Check, Loader, MapPin, Wallet } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import AutosaveInput from '../components/AutosaveInput'
import RolePicker from '../components/RolePicker'
import { Avatar, Input, RoleChip, Select, Switch, ToggleChip } from '../components/ui'
import { COUNTRIES, countryName } from '../lib/countries'
import { PACES, PACE_OPTIONS, STAGE_OPTIONS } from '../lib/onboarding'
import { useProfile, useUpdateProfile } from '../lib/profile'
import { PACE_TARGET, WORK_MODE_LABEL, type IdealStart, type Profile as ProfileRow, type WorkMode } from '../lib/types'

const START_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'asap', label: 'As soon as possible' },
  { value: 'months', label: 'In the next couple months' },
  { value: 'right_fit', label: 'Whenever the right fit comes' },
]
// The prototype's list for the salary floor.
const FLOOR_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'].map((c) => ({ value: c, label: c }))
const SETUPS: WorkMode[] = ['remote', 'hybrid', 'onsite']

const cardShape = 'flex flex-col rounded-2xl p-6 shadow-card'
const card = `${cardShape} border border-paper-200 bg-surface`
const h2 = 'text-lg font-semibold leading-[1.3] tracking-[-0.02em] text-ink'
const sub = 'text-sm leading-[1.45] text-ink-500'

// Prototype `ProfileScreen`. Everything autosaves: buttons and menus at once, text a moment
// after you stop typing. Email change, notification choices, data export and account
// deletion live in Settings.
export default function Profile() {
  const { session } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const [touched, setTouched] = useState(false)

  if (isLoading) return null
  if (!profile) return <p className="text-sm text-coral-700">Your profile couldn't be loaded. Try reloading the page.</p>

  const save = (patch: Partial<ProfileRow>) => {
    setTouched(true)
    update.mutate(patch)
  }
  const status = update.isPending ? 'saving' : update.isError ? 'error' : touched ? 'saved' : 'idle'

  const stage = STAGE_OPTIONS.find((o) => o.id === profile.search_stage)
  const pace = PACES[profile.weekly_pace]
  const since = new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  const meta = session?.user.user_metadata ?? {}
  const displayName = profile.full_name || meta.full_name || meta.name || ''

  return (
    <div className="flex max-w-[1040px] flex-col gap-7">
      <header className="flex flex-wrap items-center gap-5">
        <Avatar name={displayName || session?.user.email || '?'} size={72} tone="brand" />
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{displayName || 'Your profile'}</h1>
          <div className="flex flex-wrap items-center gap-2.5 text-[15px] leading-[1.4] text-ink-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-[5px] text-xs font-semibold leading-none text-blue-700">
              <span className="size-1.5 rounded-full bg-blue-600" />
              {stage ? stage.label : 'Search stage not set'}
            </span>
            <span>
              Searching since <span className="font-mono text-[13px] text-ink-700">{since}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs font-medium leading-none text-ink-500" aria-live="polite">
          {status === 'saving' ? (
            <Loader size={15} className="animate-spin text-ink-400" />
          ) : (
            <Check size={15} className={status === 'saved' ? 'text-mint-600' : 'text-ink-400'} />
          )}
          {status === 'saving'
            ? 'Saving…'
            : status === 'saved'
              ? 'All changes saved'
              : status === 'error'
                ? <span className="text-coral-700">Couldn't save — check your connection</span>
                : 'Changes save automatically'}
        </div>
      </header>

      <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div className="flex flex-col gap-5">
          <section className={`${card} gap-4`}>
            <Heading title="Where you are" sub="Searches change. Update this whenever yours does — we'll adjust what we show you." />
            <div className="grid grid-cols-2 gap-2">
              {STAGE_OPTIONS.map(({ id, icon: Icon, label }) => {
                const on = profile.search_stage === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => save({ search_stage: id })}
                    className={`flex items-center gap-2.5 rounded-xl border-[1.5px] p-3 text-left text-sm leading-[1.25] text-ink transition-[border-color,background,transform] active:scale-[.97] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-focus)] ${
                      on ? 'border-blue-600 bg-blue-50 font-semibold' : 'border-paper-200 bg-surface font-medium hover:border-ink-300'
                    }`}
                  >
                    <Icon size={17} className={on ? 'text-blue-600' : 'text-ink-500'} />
                    {id === 'interviewing' ? 'Interviewing' : label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className={`${card} gap-[22px]`}>
            <Heading title="What you're looking for" sub="Used to pick openings on Jobs. Everything here is optional." />
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-semibold leading-[1.2] text-ink">Roles</div>
              <RolePicker id="pf-role" variant="profile" roles={profile.target_roles} onChange={(target_roles) => save({ target_roles })} />
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-semibold leading-[1.2] text-ink">Work setup</div>
              <div className="flex flex-wrap gap-2">
                {SETUPS.map((m) => {
                  const on = profile.work_setups.includes(m)
                  return (
                    <ToggleChip
                      key={m}
                      on={on}
                      onClick={() =>
                        save({ work_setups: on ? profile.work_setups.filter((x) => x !== m) : SETUPS.filter((x) => x === m || profile.work_setups.includes(x)) })
                      }
                    >
                      {WORK_MODE_LABEL[m]}
                    </ToggleChip>
                  )
                })}
              </div>
            </div>
            {/* Used to match openings on Jobs (roadmap 6.2c). */}
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-semibold leading-[1.2] text-ink">Countries I can work in</div>
              <div className="flex flex-wrap items-center gap-2">
                {profile.work_countries.map((c) => (
                  <RoleChip key={c} label={countryName(c)} onRemove={() => save({ work_countries: profile.work_countries.filter((x) => x !== c) })} />
                ))}
                <select
                  value=""
                  onChange={(e) => e.target.value && save({ work_countries: [...profile.work_countries, e.target.value] })}
                  aria-label="Add a country you can work in"
                  className="h-[34px] cursor-pointer rounded-full border-[1.5px] border-paper-300 bg-surface px-3 text-sm text-ink-500 outline-none hover:border-ink-300 focus:border-blue-500"
                >
                  <option value="">+ Add a country</option>
                  {COUNTRIES.filter((c) => !profile.work_countries.includes(c.code)).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-ink-500">Where you're allowed to work, so remote roles limited to other countries are left out.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-semibold leading-[1.2] text-ink">Do you need visa sponsorship?</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: true, label: 'Yes, I need sponsorship' },
                  { v: false, label: 'No' },
                ].map(({ v, label }) => (
                  <ToggleChip
                    key={label}
                    on={profile.needs_visa_sponsorship === v}
                    onClick={() => save({ needs_visa_sponsorship: profile.needs_visa_sponsorship === v ? null : v })}
                  >
                    {label}
                  </ToggleChip>
                ))}
              </div>
              <p className="text-xs text-ink-500">If yes, jobs that say they can't sponsor are hidden and ones that do are shown first.</p>
            </div>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              <AutosaveInput
                id="pf-loc"
                label="Locations"
                icon={MapPin}
                placeholder="City or region"
                saved={profile.locations ?? ''}
                onSave={(v) => save({ locations: v.trim() || null })}
              />
              <Select
                id="pf-start"
                label="Ideal start"
                value={profile.ideal_start ?? ''}
                onChange={(e) => save({ ideal_start: (e.target.value || null) as IdealStart | null })}
                options={START_OPTIONS}
              />
              <AutosaveInput
                id="pf-sal"
                label="Salary floor"
                icon={Wallet}
                inputMode="numeric"
                placeholder="e.g. 85,000"
                hint="Private — only used to filter Jobs"
                saved={profile.salary_floor == null ? '' : profile.salary_floor.toLocaleString()}
                onSave={(v) => {
                  const digits = v.replace(/\D/g, '')
                  const n = digits ? Number(digits) : null
                  save({ salary_floor: n, salary_floor_currency: n == null ? profile.salary_floor_currency : profile.salary_floor_currency ?? 'USD' })
                }}
              />
              <Select
                id="pf-cur"
                label="Currency"
                value={profile.salary_floor_currency ?? 'USD'}
                onChange={(e) => save({ salary_floor_currency: e.target.value })}
                options={FLOOR_CURRENCIES}
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          {/* Saved now; the weekly target itself is used from Phase 5. */}
          <section className={`${cardShape} gap-[18px] bg-oxford-900 text-white`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className={`${h2} text-white`}>Weekly pace</h2>
                <p className={`${sub} text-white/70 [text-wrap:pretty]`}>{pace.note}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-mono text-[28px] font-medium leading-none text-gold-400">{PACE_TARGET[profile.weekly_pace]}</span>
                <span className="text-xs font-medium leading-[1.2] text-white/60">a week</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 rounded-[14px] bg-white/[.08] p-1">
              {PACE_OPTIONS.map(({ id, label }) => {
                const on = profile.weekly_pace === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => save({ weekly_pace: id })}
                    className={`h-10 rounded-[10px] text-sm font-semibold leading-none transition-[background,transform] active:scale-[.97] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-focus)] ${
                      on ? 'bg-gold-500 text-on-spark' : 'text-white/80 hover:bg-white/[.06]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Prototype ProfileScreen's "Reminders" card; the other choices are in Settings → Notifications. */}
          <section className={`${card} gap-1.5`}>
            <h2 className={`${h2} mb-2`}>Reminders</h2>
            <div className="flex items-center gap-4 border-t border-paper-200 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-sm font-semibold leading-[1.3] text-ink">Suggest follow-ups</span>
                <span className="text-[13px] leading-[1.4] text-ink-500">When you mark a job Applied, offer a follow-up reminder a week later.</span>
              </div>
              <Switch
                id="pf-suggest-follow"
                label=""
                ariaLabel="Suggest follow-ups"
                checked={profile.suggest_follow_ups}
                onChange={(v) => save({ suggest_follow_ups: v })}
              />
            </div>
          </section>

          <section className={`${card} gap-4`}>
            <h2 className={h2}>Account</h2>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
              {/* Starts from the same name as the header (saved name, else the one from Google sign-in). */}
              <AutosaveInput id="pf-name" label="Name" saved={displayName} onSave={(v) => save({ full_name: v.trim() || null })} />
              {/* Changing email needs a confirmation link, so it lives in Settings. */}
              <Input id="pf-email" label="Email" type="email" value={session?.user.email ?? ''} readOnly className="text-ink-500" hint="Change it in Settings" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Heading({ title, sub: text }: { title: string; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className={h2}>{title}</h2>
      <p className={sub}>{text}</p>
    </div>
  )
}
