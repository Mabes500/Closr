import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import InterviewRow from '../components/InterviewRow'
import ScheduleDialog, { type ScheduleInit } from '../components/ScheduleDialog'
import { Button, TopBar } from '../components/ui'
import { useReminders, whenDue, type ReminderWithApp } from '../lib/reminders'

// Interview reminders by date. Temporary: Schedule (roadmap 3.2) replaces this page.
export default function Interviews() {
  const { data: reminders = [], isLoading, error } = useReminders()
  const [editing, setEditing] = useState<ScheduleInit | null>(null)

  // "Next 7 days" starts at midnight today, so an interview from this morning still shows.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const interviews = reminders.filter((r) => r.type === 'interview')
  const at = (r: ReminderWithApp) => new Date(whenDue(r))
  const next7 = interviews.filter((r) => at(r) >= today && at(r) < weekEnd)
  const later = interviews.filter((r) => at(r) >= weekEnd)
  const past = interviews.filter((r) => at(r) < today).reverse()

  return (
    <div className="w-full max-w-3xl">
      <Link
        to="/schedule"
        className="-ml-0.5 mb-3 inline-flex items-center gap-1.5 rounded-lg py-1.5 pl-0.5 pr-2 text-sm font-semibold leading-none text-ink-500 hover:bg-paper-100 hover:text-ink"
      >
        <ArrowLeft size={16} />
        Schedule
      </Link>
      <div className="mb-6">
        <TopBar title="Interviews" sub={`${next7.length} in the next 7 days · ${next7.length + later.length} upcoming`}>
          <Button onClick={() => setEditing({ type: 'interview' })}>+ Add interview</Button>
        </TopBar>
      </div>

      {error && <p className="text-sm text-coral-700">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : (
        <div className="space-y-8">
          <Section title="Next 7 days" accent items={next7} empty="Nothing in the next 7 days." onOpen={setEditing} />
          {later.length > 0 && <Section title="Later" items={later} onOpen={setEditing} />}
          {past.length > 0 && <Section title="Past" items={past} onOpen={setEditing} />}
        </div>
      )}

      {editing && <ScheduleDialog init={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function Section({
  title,
  items,
  accent,
  empty,
  onOpen,
}: {
  title: string
  items: ReminderWithApp[]
  accent?: boolean
  empty?: string
  onOpen: (r: ReminderWithApp) => void
}) {
  return (
    <section className={accent ? 'rounded-xl border border-paper-200 bg-white/60 p-4' : ''}>
      <header className="mb-3 flex items-center gap-2 px-1">
        {accent && <span className="size-2 rounded-full bg-status-interviewing" />}
        <h2 className={`text-sm font-semibold ${accent ? '' : 'text-ink-500'}`}>{title}</h2>
        <span className="font-mono text-xs text-ink-400">{items.length}</span>
      </header>
      {items.length ? (
        <div className="flex flex-col gap-2">
          {items.map((r) => (
            <InterviewRow key={r.id} interview={r} onClick={() => onOpen(r)} />
          ))}
        </div>
      ) : (
        <p className="px-1 py-4 text-sm text-ink-400">{empty}</p>
      )}
    </section>
  )
}
