import { useState, type ReactNode } from 'react'
import { Info, Minus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isOverdue } from '../components/RemChip'
import { ProgressRing, StreakDots } from '../components/Progress'
import { Button, Card, IconButton, TopBar } from '../components/ui'
import { useApplications } from '../lib/applications'
import { useCheckins } from '../lib/checkins'
import { useCvVersions } from '../lib/cvVersions'
import { useStatusEvents } from '../lib/events'
import { PACE_ORDER, useWeekProgress, weeklyApplied } from '../lib/goals'
import { usePlanDone, useTogglePlanStep, type PlanStep } from '../lib/plan'
import { useUpdateProfile } from '../lib/profile'
import { useReminders } from '../lib/reminders'
import { groupStats, MIN_TO_COMPARE, type GroupStats } from '../lib/stats'
import { SOURCE_LABEL, type JobChannel } from '../lib/types'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// Prototype `GoalsScreen`: your plan this week, your progress, and what's working.
export default function Goals() {
  const p = useWeekProgress()
  const updateProfile = useUpdateProfile()
  if (!p.loaded) return null

  // Raise/lower steps through the paces: 2, 5, 10 a week.
  const i = PACE_ORDER.indexOf(p.pace)
  const setPace = (step: number) => updateProfile.mutate({ weekly_pace: PACE_ORDER[i + step] })
  const weeks = weeklyApplied(p.days, p.today)

  return (
    <div className="flex max-w-[1000px] flex-col gap-4">
      <TopBar title="Goals" />

      <Plan week={p.week} target={p.target} applied={p.applied} />

      <Eyebrow className="mt-1.5">Your progress</Eyebrow>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <Card className="p-6">
          <Eyebrow>Weekly applications</Eyebrow>
          <div className="mt-3.5 flex items-center gap-5">
            <ProgressRing value={p.applied} max={p.target} size={104} stroke={10} />
            <div>
              <div className="text-4xl font-semibold leading-none text-ink">
                {p.applied}
                <span className="text-lg text-ink-500">/{p.target}</span>
              </div>
              <div className="mt-1 text-[13px] text-ink-500">this week</div>
              <div className="mt-2.5 flex items-center gap-2">
                <StepButton icon={Minus} label="Lower weekly target" disabled={i <= 0} onClick={() => setPace(-1)} />
                <span className="text-xs font-medium text-ink-500">Target</span>
                <StepButton icon={Plus} label="Raise weekly target" disabled={i >= PACE_ORDER.length - 1} onClick={() => setPace(1)} />
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <Eyebrow>Consistency</Eyebrow>
          <div className="my-3.5 flex flex-col gap-1.5">
            <b className="text-4xl font-semibold leading-none text-ink">{plural(p.streak, 'day')}</b>
            <span className="text-[13px] leading-[1.45] text-ink-500">
              {p.streak
                ? 'active streak. Adding jobs, moving them, notes, reminders, check-ins and plan steps all count.'
                : 'Add a job or finish a plan step today to start a streak.'}
            </span>
          </div>
          <StreakDots streak={p.streak} activeToday={p.activeToday} />
        </Card>
        <Card className="p-6 [grid-column:1/-1]">
          <Eyebrow>Last 8 weeks</Eyebrow>
          <WeeksChart weeks={weeks} target={p.target} />
        </Card>
      </div>

      <Working />
    </div>
  )
}

// "Your plan this week": next best steps from your own data. A step shows while there's
// something to do (or you've ticked it this week); "reach your target" ticks itself.
function Plan({ week, target, applied }: { week: string; target: number; applied: number }) {
  const navigate = useNavigate()
  const { data: apps = [] } = useApplications()
  const { data: reminders = [] } = useReminders()
  const checkins = useCheckins() ?? []
  const { data: done = new Set<PlanStep>() } = usePlanDone(week)
  const toggle = useTogglePlanStep(week)

  const overdue = reminders.filter((r) => r.type === 'follow' && isOverdue(r))
  const saved = apps.filter((a) => a.status === 'saved')
  const remaining = Math.max(0, target - applied)
  const names = (xs: string[]) => (xs.length > 3 ? `${xs.slice(0, 3).join(', ')} and ${xs.length - 3} more` : xs.join(', '))

  const steps: { id: PlanStep; count: number; title: string; evid: string; cta: string; go: () => void; auto?: boolean }[] = [
    {
      id: 'followups',
      count: overdue.length,
      title: `Send ${plural(overdue.length, 'overdue follow-up')}`,
      evid: overdue.length ? `Due for ${names(overdue.map((r) => r.application?.company ?? r.title))}.` : 'Follow-ups are up to date.',
      cta: 'Open Schedule',
      go: () => navigate('/schedule'),
    },
    {
      id: 'checkins',
      count: checkins.length,
      title: `Answer ${plural(checkins.length, 'check-in')}`,
      evid: checkins.length ? `${names(checkins.map((c) => c.app.company))} ${checkins.length === 1 ? 'has' : 'have'} been quiet for a week or more.` : 'No quiet applications.',
      cta: 'Open Check-ins',
      go: () => navigate('/checkins'),
    },
    {
      id: 'saved',
      count: saved.length,
      title: `Apply to your ${plural(saved.length, 'saved job')}`,
      evid: saved.length ? `${names(saved.map((a) => a.company))} ${saved.length === 1 ? 'is' : 'are'} saved but not applied to yet.` : 'Nothing saved.',
      cta: 'Open board',
      go: () => navigate('/'),
    },
    {
      id: 'target',
      count: remaining,
      auto: remaining === 0,
      title: remaining ? `${plural(remaining, 'more application')} to reach this week's target` : `This week's target of ${target} reached`,
      evid: `${applied} of ${target} applications so far this week.`,
      cta: 'Add a job',
      go: () => navigate('/', { state: { add: 'link' } }),
    },
  ]
  const shown = steps.filter((s) => s.count > 0 || s.auto || done.has(s.id))
  const isDone = (s: (typeof steps)[number]) => !!s.auto || done.has(s.id)
  const nDone = shown.filter(isDone).length

  return (
    <Card className="flex flex-col gap-3.5 p-6">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Eyebrow>Next best steps</Eyebrow>
          <h2 className="mt-1.5 text-xl font-semibold leading-[1.25] tracking-[-0.02em] text-ink">Your plan this week</h2>
        </div>
        <span className="font-mono text-[13px] text-ink-500">
          {nDone} of {shown.length} done
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-200">
        <div className="h-full rounded-full bg-gold-500 transition-[width] duration-500" style={{ width: `${shown.length ? (nDone / shown.length) * 100 : 0}%` }} />
      </div>
      <div className="flex flex-col">
        {shown.map((s) => {
          const d = isDone(s)
          return (
            <div key={s.id} className="flex flex-wrap items-start gap-3.5 border-t border-paper-200 py-3.5">
              <input
                type="checkbox"
                checked={d}
                disabled={s.auto}
                onChange={() => toggle.mutate({ step: s.id, done: !d })}
                aria-label={`Mark done: ${s.title}`}
                className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-oxford-900 disabled:cursor-default"
              />
              <div className={`flex min-w-0 flex-[1_1_220px] flex-col gap-[3px] ${d ? 'opacity-55' : ''}`}>
                <b className={`text-[15px] font-semibold leading-[1.35] text-ink ${d ? 'line-through' : ''}`}>{s.title}</b>
                <span className="text-[13px] leading-[1.45] text-ink-700">{s.evid}</span>
              </div>
              {!d && (
                <Button size="sm" variant="secondary" onClick={s.go} className="ml-auto">
                  {s.cta}
                </Button>
              )}
            </div>
          )
        })}
        {!shown.length && <p className="border-t border-paper-200 pt-3.5 text-sm text-ink-500">Nothing pressing this week. Nice work.</p>}
      </div>
      <p className="text-[13px] text-ink-500">Steps come from your own board. Finished steps count toward your streak.</p>
    </Card>
  )
}

// Weekly applications as bars, with the target as a dashed line. Hover a bar for its week.
function WeeksChart({ weeks, target }: { weeks: { start: string; count: number }[]; target: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(target, ...weeks.map((w) => w.count), 1)
  const label = (start: string) => new Date(`${start}T12:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const H = 120
  return (
    <div className="mt-4">
      <div className="relative" style={{ height: H }}>
        {/* Target line */}
        <div className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-ink-300" style={{ bottom: (target / max) * H }}>
          <span className="absolute -top-[18px] right-0 bg-white pl-1 text-[11px] font-medium text-ink-500">Target {target}</span>
        </div>
        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-paper-200">
          {weeks.map((w, i) => {
            const current = i === weeks.length - 1
            return (
              <div
                key={w.start}
                className="relative flex h-full flex-1 items-end justify-center px-1.5"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`Week of ${label(w.start)}: ${plural(w.count, 'application')}`}
              >
                <div
                  className={`rounded-t ${current ? 'bg-blue-600' : 'bg-blue-500/45'} ${hover === i ? 'brightness-90' : ''}`}
                  style={{ width: '100%', maxWidth: 40, height: w.count ? Math.max(3, (w.count / max) * H) : 0 }}
                />
                {current && w.count > 0 && <span className="absolute font-mono text-xs text-ink" style={{ bottom: (w.count / max) * H + 4 }}>{w.count}</span>}
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-oxford-900 px-2.5 py-1.5 text-xs text-white shadow-dialog">
                    Week of {label(w.start)} · <b className="font-semibold">{plural(w.count, 'application')}</b>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {weeks.map((w, i) => (
          <span key={w.start} className={`flex-1 text-center text-[11px] ${i === weeks.length - 1 ? 'font-semibold text-ink' : 'text-ink-500'}`}>
            {i === weeks.length - 1 ? 'This week' : label(w.start)}
          </span>
        ))}
      </div>
    </div>
  )
}

// "What's working": your own response rate by source and by CV version.
function Working() {
  const { data: apps = [] } = useApplications()
  const { data: events = [] } = useStatusEvents()
  const { data: versions = [] } = useCvVersions()
  const bySource = groupStats(apps, events, (a) => a.source ?? 'none')
  const byCv = groupStats(apps, events, (a) => a.cv_version_id)
  const sources = [...bySource].map(([key, s]) => ({ key, label: key === 'none' ? 'Source not set' : SOURCE_LABEL[key as JobChannel], s }))
  const cvs = [...byCv].map(([key, s]) => ({ key, label: versions.find((v) => v.id === key)?.label ?? 'CV version', s }))

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <Eyebrow>What's working</Eyebrow>
        <h2 className="mt-1.5 text-xl font-semibold leading-[1.25] tracking-[-0.02em] text-ink">Your response rate</h2>
        <p className="mt-1 text-sm text-ink-500">A response means the job reached Interviewing or Offer, or you heard back with a rejection.</p>
      </div>
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <RateList title="By source" rows={sources} empty="Add a source to your jobs (in the job drawer) to see which channels reply." />
        <RateList title="By CV version" rows={cvs} empty="Pick the CV version you sent on each job to compare versions." />
      </div>
    </Card>
  )
}

function RateList({ title, rows, empty }: { title: string; rows: { key: string; label: string; s: GroupStats }[]; empty: string }) {
  const sorted = [...rows].sort((a, b) => b.s.sent - a.s.sent)
  const thin = sorted.some((r) => r.s.sent < MIN_TO_COMPARE)
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[13px] font-semibold text-ink">{title}</div>
      {sorted.length ? (
        <>
          {sorted.map(({ key, label, s }) => {
            const enough = s.sent >= MIN_TO_COMPARE
            const pct = Math.round((s.rate ?? 0) * 100)
            return (
              <div key={key}className="grid grid-cols-[minmax(90px,150px)_1fr_auto] items-center gap-3 text-[13px]">
                <span className="truncate text-ink-700" title={label}>
                  {label}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-paper-200">
                  <span className={`block h-full rounded-full ${enough ? 'bg-blue-600' : 'bg-paper-400'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </span>
                <span className={`whitespace-nowrap text-right font-mono ${enough ? 'text-ink' : 'text-ink-400'}`}>
                  {pct}% <span className="text-ink-400">of {s.sent}</span>
                </span>
              </div>
            )
          })}
          {thin && (
            <p className="flex items-start gap-2 text-xs leading-[1.45] text-ink-500">
              <Info size={14} className="mt-px shrink-0" />
              Not enough data yet for the grey rows. A rate starts to mean something at about {MIN_TO_COMPARE} applications.
            </p>
          )}
        </>
      ) : (
        <p className="text-[13px] text-ink-500">{empty}</p>
      )}
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500 ${className}`}>{children}</div>
}

// Outline icon button for the target (prototype IconButton variant="outline" size="sm").
function StepButton({ disabled, ...rest }: { icon: typeof Plus; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <span className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <IconButton {...rest} className="size-8 border-[1.5px] border-paper-300" />
    </span>
  )
}
