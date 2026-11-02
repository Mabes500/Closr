import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Search, type LucideIcon } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Logo, Mark } from '../components/Logo'
import { Button, Input, RoleChip, SuggestChip } from '../components/ui'
import {
  OB_STEPS,
  OB_SUGGEST,
  PACE_OPTIONS,
  STAGE_OPTIONS,
  START_OPTIONS,
  cleanRole,
  type StartChoice,
} from '../lib/onboarding'
import { firstName, useProfile, useUpdateProfile } from '../lib/profile'
import { PACE_TARGET, type SearchStage, type WeeklyPace } from '../lib/types'

type State = { step: number; stage: SearchStage | null; roles: string[]; draft: string; pace: WeeklyPace; source: StartChoice | null }
const BLANK: State = { step: 0, stage: null, roles: [], draft: '', pace: 'steady', source: null }

// /welcome. Arrives here after sign-in while profiles.onboarded_at is null, or from
// Profile → "Redo onboarding" (location.state.redo).
export type OnboardingState = { redo?: boolean }

// Prototype `Onboarding`: four steps, progress bar, back, skip step, skip all, Enter to
// continue, and the "You're all set" screen. Finishing or skipping sets onboarded_at.
export default function Onboarding() {
  const { session } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const navigate = useNavigate()
  const redo = !!(useLocation().state as OnboardingState | null)?.redo
  const [s, setS] = useState<State>(BLANK)
  const [seeded, setSeeded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Redo starts from what's saved; a first run starts blank.
  useEffect(() => {
    if (seeded || !profile) return
    if (redo) setS({ ...BLANK, stage: profile.search_stage, roles: profile.target_roles, pace: profile.weekly_pace })
    setSeeded(true)
  }, [profile, redo, seeded])

  const done = s.step >= 4
  const next = () => setS((x) => ({ ...x, step: Math.min(x.step + 1, 4) }))
  const back = () => setS((x) => ({ ...x, step: Math.max(x.step - 1, 0) }))

  // Enter continues, except while typing in a field or focused on a button.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (e.key === 'Enter' && s.step < 4 && tag !== 'INPUT' && tag !== 'BUTTON') next()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [s.step])
  useEffect(() => () => clearTimeout(timer.current), [])

  if (isLoading) return null
  // Already set up and not redoing: nothing to do here.
  if (profile?.onboarded_at && !redo && !update.isPending && !done) return <Navigate to="/" replace />

  const first = firstName(profile, session?.user.user_metadata ?? {}, session?.user.email)
  const def = OB_STEPS[Math.min(s.step, 3)]

  // Save answers and mark onboarding done (keeping the first completion date on a redo).
  const save = (x: State) =>
    update.mutateAsync({
      search_stage: x.stage,
      target_roles: x.roles,
      weekly_pace: x.pace,
      onboarded_at: profile?.onboarded_at ?? new Date().toISOString(),
    })

  async function finish() {
    await save(s)
    if (s.source === 'import') navigate('/import', { replace: true })
    else if (s.source === 'link') navigate('/', { replace: true, state: { add: 'link' } })
    else navigate('/', { replace: true })
  }

  // First run: keep whatever was answered and use defaults for the rest.
  // Redo: leave the saved profile as it was.
  async function skipAll() {
    if (redo) return navigate('/profile', { replace: true })
    await save(s)
    navigate('/', { replace: true })
  }

  function skipStep() {
    if (def.key === 'stage' || def.key === 'source') setS((x) => ({ ...x, [def.key]: null }))
    if (def.key === 'pace') setS((x) => ({ ...x, pace: 'steady' }))
    next()
  }

  // Picking a stage or start choice moves on by itself; pace waits for Continue.
  function pick<K extends 'stage' | 'pace' | 'source'>(key: K, id: State[K]) {
    setS((x) => ({ ...x, [key]: id }))
    if (key !== 'pace') {
      clearTimeout(timer.current)
      timer.current = setTimeout(next, 320)
    }
  }

  function addRole(raw: string) {
    const t = cleanRole(raw)
    if (!t) return
    setS((x) =>
      x.roles.some((r) => r.toLowerCase() === t.toLowerCase()) ? { ...x, draft: '' } : { ...x, roles: [...x.roles, t], draft: '' },
    )
  }

  const q = s.draft.trim().toLowerCase()
  const taken = new Set(s.roles.map((r) => r.toLowerCase()))
  const suggestions = OB_SUGGEST.filter((x) => !taken.has(x.toLowerCase()) && (!q || x.toLowerCase().includes(q))).slice(0, 6)
  const pace = PACE_OPTIONS.find((o) => o.id === s.pace)!
  const stage = STAGE_OPTIONS.find((o) => o.id === s.stage)
  const doneCta = s.source === 'import' ? 'Import my spreadsheet' : s.source === 'link' ? 'Add my first job' : 'Go to my board'
  const doneSub =
    s.stage === 'interviewing'
      ? "Interviews are a big deal. We'll keep dates, prep, and follow-ups in one calm place."
      : `Your weekly target is ${PACE_TARGET[s.pace]} applications. We'll nudge you when a follow-up is due — the rest is up to you.`

  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <header className="flex items-center justify-between gap-4 px-[max(16px,min(32px,4vw))] py-6">
        <Logo size={28} />
        {!done && (
          <Button variant="ghost" size="sm" onClick={skipAll} disabled={update.isPending}>
            Skip setup for now
          </Button>
        )}
      </header>
      <main className="flex flex-1 justify-center px-[max(16px,env(safe-area-inset-left))] pb-16 pt-6">
        <div className="flex w-full max-w-[520px] flex-col gap-7">
          {!done ? (
            <>
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= s.step ? 'bg-blue-600' : 'bg-paper-200'}`} />
                  ))}
                </div>
                <div className="font-mono text-xs font-medium leading-none tracking-[.02em] text-ink-500">{s.step + 1} of 4</div>
              </div>

              <div key={s.step} className="flex animate-[ob-in_220ms_cubic-bezier(.2,.8,.2,1)] flex-col gap-7">
                <div className="flex flex-col gap-2">
                  {s.step === 0 && <div className="text-[15px] font-semibold leading-[1.3] text-blue-600">Welcome, {first}</div>}
                  <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.03em] text-ink [text-wrap:pretty]">{def.title}</h1>
                  <p className="text-base leading-normal text-ink-500 [text-wrap:pretty]">{def.sub}</p>
                </div>

                {def.key === 'stage' && <Options options={STAGE_OPTIONS} value={s.stage} onPick={(id) => pick('stage', id)} />}
                {def.key === 'pace' && <Options options={PACE_OPTIONS} value={s.pace} onPick={(id) => pick('pace', id)} />}
                {def.key === 'source' && <Options options={START_OPTIONS} value={s.source} onPick={(id) => pick('source', id)} />}
                {def.key === 'roles' && (
                  <div className="flex flex-col gap-5">
                    <Input
                      id="ob-role"
                      icon={Search}
                      placeholder="Type a job title and press Enter"
                      value={s.draft}
                      autoFocus
                      onChange={(e) => setS({ ...s, draft: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (s.draft.trim()) addRole(s.draft)
                          else next()
                        }
                        if (e.key === 'Backspace' && !s.draft && s.roles.length) setS((x) => ({ ...x, roles: x.roles.slice(0, -1) }))
                      }}
                      hint={
                        s.roles.length
                          ? `${s.roles.length} added — press Enter on an empty field to continue`
                          : 'Press Enter to add. You can change these any time.'
                      }
                    />
                    {s.roles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {s.roles.map((r) => (
                          <RoleChip key={r} label={r} onRemove={() => setS((x) => ({ ...x, roles: x.roles.filter((y) => y !== r) }))} />
                        ))}
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        <div className="text-[13px] font-semibold leading-[1.2] text-ink-500">{q ? 'Matching titles' : 'Popular titles'}</div>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((x) => (
                            <SuggestChip key={x} label={x} onAdd={() => addRole(x)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex gap-1">
                    {s.step > 0 && (
                      <Button variant="ghost" icon={ArrowLeft} onClick={back}>
                        Back
                      </Button>
                    )}
                    <Button variant="ghost" onClick={skipStep}>
                      Skip
                    </Button>
                  </div>
                  <Button size="lg" iconRight={ArrowRight} onClick={next}>
                    {s.step === 3 ? 'Finish setup' : 'Continue'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex animate-[ob-in_260ms_cubic-bezier(.34,1.56,.64,1)] flex-col gap-5">
              <div className="flex flex-col gap-6 rounded-[28px] bg-oxford-900 p-[clamp(22px,5vw,32px)] text-white">
                <div className="flex flex-col gap-2.5">
                  <Mark size={36} onDark />
                  <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-[-0.03em]">You're all set, {first}.</h1>
                  <p className="text-base leading-normal text-white/75 [text-wrap:pretty]">{doneSub}</p>
                </div>
                <div className="flex flex-col border-t border-white/15">
                  <Summary k="Where you are" v={stage ? stage.label : 'Not set yet'} />
                  <Summary k="Roles" v={s.roles.length ? s.roles.join(', ') : 'Any — add later in Jobs'} />
                  <Summary k="Weekly target" v={`${pace.label} · ${PACE_TARGET[s.pace]} applications`} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[13px] leading-[1.4] text-white/60">Change any of this later in your profile.</span>
                  <Button variant="spark" size="lg" iconRight={ArrowRight} onClick={finish} disabled={update.isPending}>
                    {update.isPending ? 'Saving…' : doneCta}
                  </Button>
                </div>
              </div>
              {update.error && <p className="text-center text-sm text-coral-700">{update.error.message}</p>}
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setS(BLANK)}>
                  Replay onboarding
                </Button>
              </div>
            </div>
          )}
          {!done && update.error && <p className="text-sm text-coral-700">{update.error.message}</p>}
        </div>
      </main>
    </div>
  )
}

function Summary({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/15 py-3.5">
      <span className="text-sm font-medium leading-[1.3] text-white/60">{k}</span>
      <span className="text-right text-[15px] font-semibold leading-[1.4]">{v}</span>
    </div>
  )
}

// Radio-style option cards (prototype `ob-opt`).
function Options<T extends string>({
  options,
  value,
  onPick,
}: {
  options: { id: T; icon: LucideIcon; label: string; sub: string; tag?: string }[]
  value: T | null
  onPick: (id: T) => void
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2.5">
      {options.map(({ id, icon: Icon, label, sub, tag }) => {
        const on = value === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(id)}
            className={`flex w-full items-center gap-4 rounded-2xl border-[1.5px] py-3.5 pl-3.5 pr-[18px] text-left transition-[border-color,background,box-shadow,transform] hover:border-ink-300 active:scale-[.985] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-focus)] ${
              on ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgb(35_70_217/0.12)]' : 'border-paper-200 bg-white shadow-card'
            }`}
          >
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors ${on ? 'bg-blue-600 text-white' : 'bg-paper-100 text-ink-700'}`}>
              <Icon size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="flex flex-wrap items-center gap-2 text-base font-semibold leading-[1.3] text-ink">
                {label}
                {tag && <span className="rounded-full bg-gold-100 px-2 py-1 text-[11px] font-semibold leading-none text-gold-800">{tag}</span>}
              </span>
              <span className="text-sm leading-[1.4] text-ink-500">{sub}</span>
            </span>
            <span
              className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all ${on ? 'border-blue-600 bg-blue-600' : 'border-paper-300'}`}
            >
              <span className={`size-2 rounded-full bg-white transition-transform ${on ? 'scale-100' : 'scale-0'}`} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
