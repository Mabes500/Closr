import { useState } from 'react'
import { Bell, CalendarClock, CalendarPlus, ChevronDown, ChevronRight, CircleCheck, Coffee, Mail, Send, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { REM_META } from '../components/RemChip'
import ReminderRow from '../components/ReminderRow'
import ScheduleDialog, { type ScheduleInit } from '../components/ScheduleDialog'
import { Button, Card, EmptyState, FilterChip, SectionTitle, TopBar } from '../components/ui'
import { daysAgo } from '../lib/format'
import { plusDays, useReminders, whenDue, type ReminderWithApp } from '../lib/reminders'
import type { ReminderType } from '../lib/types'

const KINDS: { value: 'all' | ReminderType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'interview', label: 'Interviews' },
  { value: 'follow', label: 'Follow-ups' },
  { value: 'deadline', label: 'Deadlines' },
  { value: 'custom', label: 'Other' },
]

// Days from today (0 = today, negative = overdue), by the time it's next due.
const dayDiff = (r: ReminderWithApp) => -daysAgo(whenDue(r))

const GROUPS: [string, (d: number) => boolean][] = [
  ['Overdue', (d) => d < 0],
  ['Today', (d) => d === 0],
  ['Tomorrow', (d) => d === 1],
  ['Later this week', (d) => d > 1 && d < 7],
  ['Later', (d) => d >= 7],
]

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

// Prototype `ScheduleScreen`: every reminder, grouped by when it's due, with a week strip.
export default function Schedule() {
  const navigate = useNavigate()
  const { data: rems = [], isLoading, error } = useReminders()
  const [kind, setKind] = useState<'all' | ReminderType>('all')
  const [day, setDay] = useState<number | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [editing, setEditing] = useState<ScheduleInit | null>(null)

  const pass = (r: ReminderWithApp) => kind === 'all' || r.type === kind
  const open = rems.filter((r) => !r.done && pass(r)).sort((a, b) => whenDue(a).localeCompare(whenDue(b)))
  const doneList = rems.filter((r) => r.done && pass(r)).reverse()
  const dayList = day == null ? null : open.filter((r) => dayDiff(r) === day)
  const upcoming = rems.filter((r) => !r.done)
  const overdue = upcoming.filter((r) => dayDiff(r) < 0).length

  const openJob = (id: string) => navigate('/', { state: { open: id } })
  const row = (r: ReminderWithApp) => <ReminderRow key={r.id} r={r} onEdit={setEditing} onJob={openJob} />

  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-[18px]">
      <TopBar
        title="Schedule"
        sub={
          rems.length ? (
            <span className="font-mono text-[13px]">
              {upcoming.length} upcoming · {overdue} overdue
            </span>
          ) : undefined
        }
      >
        <Button icon={CalendarPlus} onClick={() => setEditing({})}>
          New reminder
        </Button>
      </TopBar>

      {error && <p className="text-sm text-coral-700">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : !rems.length ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled yet"
            body="Interviews, follow-ups and offer deadlines show up here. Closr also suggests a follow-up when you mark a job Applied."
          >
            <Button icon={CalendarPlus} onClick={() => setEditing({ type: 'interview' })}>
              Add an interview
            </Button>
            <Button variant="secondary" icon={Send} onClick={() => setEditing({ type: 'follow' })}>
              Set a follow-up
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid items-start gap-5 min-[861px]:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            {/* Week strip: the next 7 days, with a dot per reminder. Tap a day to see only that day. */}
            <div className="grid grid-cols-[repeat(7,minmax(64px,1fr))] gap-1.5 overflow-x-auto">
              {Array.from({ length: 7 }, (_, i) => {
                const date = plusDays(i)
                const items = open.filter((r) => dayDiff(r) === i)
                const on = day === i
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDay(on ? null : i)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-[1.5px] px-1 py-2.5 transition-colors ${
                      on ? 'border-oxford-900 bg-oxford-900' : i === 0 ? 'border-blue-400 bg-white hover:bg-paper-50' : 'border-paper-200 bg-white hover:bg-paper-50'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase leading-none tracking-[.06em] ${on ? 'text-white' : 'text-ink-500'}`}>
                      {i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className={`text-xl font-semibold leading-none ${on ? 'text-white' : 'text-ink'}`}>{date.getDate()}</span>
                    <span className="flex h-1.5 gap-[3px]">
                      {items.slice(0, 4).map((r) => (
                        <i key={r.id} className={`size-1.5 rounded-full ${REM_META[r.type].dot}`} />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {KINDS.map((k) => (
                <FilterChip key={k.value} selected={kind === k.value} onClick={() => setKind(k.value)}>
                  {k.label}
                </FilterChip>
              ))}
              {day != null && (
                <FilterChip selected={false} onClick={() => setDay(null)}>
                  <X size={13} className="-ml-0.5 mr-1" />
                  {day === 0 ? 'Today' : fmtDay(plusDays(day))}
                </FilterChip>
              )}
            </div>

            {dayList ? (
              <Card className="px-6 pb-1.5 pt-5">
                <SectionTitle>{day === 0 ? 'Today' : fmtDay(plusDays(day!))}</SectionTitle>
                {dayList.length ? (
                  <div>{dayList.map(row)}</div>
                ) : (
                  <EmptyState compact icon={Coffee} tone="paper" title="A clear day" body="Nothing due. A good day to send a referral request.">
                    <Button size="sm" variant="secondary" icon={CalendarPlus} onClick={() => setEditing({ due_at: plusDays(day!).toISOString() })}>
                      Add something
                    </Button>
                  </EmptyState>
                )}
              </Card>
            ) : (
              <>
                {GROUPS.map(([label, fits]) => {
                  const list = open.filter((r) => fits(dayDiff(r)))
                  if (!list.length) return null
                  const late = label === 'Overdue'
                  return (
                    <Card key={label} className="px-6 pb-1.5 pt-5">
                      <SectionTitle right={<span className={`font-mono text-xs ${late ? 'text-coral-700' : 'text-ink-500'}`}>{list.length}</span>}>
                        <span className={late ? 'text-coral-700' : undefined}>{label}</span>
                      </SectionTitle>
                      <div>{list.map(row)}</div>
                    </Card>
                  )
                })}
                {!open.length && (
                  <Card sunken>
                    <EmptyState
                      compact
                      icon={CircleCheck}
                      title="All caught up"
                      body={kind === 'all' ? 'Every reminder is done.' : 'Nothing of this type is coming up.'}
                    />
                  </Card>
                )}
                {doneList.length > 0 && (
                  <div>
                    <Button variant="ghost" size="sm" icon={showDone ? ChevronDown : ChevronRight} onClick={() => setShowDone(!showDone)}>
                      {showDone ? 'Hide' : 'Show'} done ({doneList.length})
                    </Button>
                    {showDone && <Card className="mt-2 px-6 py-1.5">{doneList.map(row)}</Card>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-2.5 p-5">
              <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500">How reminders reach you</span>
              {[
                { icon: Bell, label: 'In Closr', on: true },
                { icon: Mail, label: 'Email', on: false },
              ].map(({ icon: Icon, label, on }) => (
                <div key={label} className={`flex items-center gap-2.5 text-sm font-medium ${on ? 'text-ink' : 'text-ink-400'}`}>
                  <Icon size={16} className={on ? 'text-blue-600' : 'text-ink-300'} />
                  <span className="flex-1">{label}</span>
                  <span className={`text-xs font-medium ${on ? 'text-mint-700' : 'text-ink-400'}`}>{on ? 'On' : 'Coming soon'}</span>
                </div>
              ))}
            </Card>
            <Card sunken className="flex flex-col gap-1.5 p-5">
              <b className="text-sm font-semibold text-ink">Automatic follow-ups</b>
              <span className="text-[13px] leading-normal text-ink-500">
                When you move a job to Applied, Closr offers a follow-up reminder a week later. You can turn this off in{' '}
                <Link to="/profile" className="font-semibold text-blue-600 hover:underline">
                  Profile
                </Link>
                .
              </span>
            </Card>
          </div>
        </div>
      )}

      {editing && <ScheduleDialog init={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
