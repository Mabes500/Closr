import { useState } from 'react'
import { Calendar, Clock, MapPin, Phone, Trash2, User, Video } from 'lucide-react'
import { useApplications } from '../lib/applications'
import { jobDays } from '../lib/board'
import { doneFields, nextMonday, plusDays, toDateStr, toTimeStr, useDeleteReminder, useSaveReminder } from '../lib/reminders'
import {
  FORMAT_LABEL,
  INTERVIEW_OUTCOMES,
  OUTCOME_LABEL,
  REMINDER_LABEL,
  REMINDER_TYPES,
  type InterviewFormat,
  type InterviewOutcome,
  type Reminder,
  type ReminderType,
} from '../lib/types'
import { REM_META } from './RemChip'
import { Button, Dialog, FilterChip, Input, Select, Tabs, TextArea } from './ui'

// Prototype DEF_TITLE.
const DEF_TITLE: Record<ReminderType, string> = {
  follow: 'Follow up with the recruiter',
  interview: 'Interview',
  deadline: 'Application deadline',
  custom: '',
}
const FORMATS = (['video', 'phone', 'onsite'] as const).map((f) => ({ value: f, label: FORMAT_LABEL[f] }))
const OUTCOMES = INTERVIEW_OUTCOMES.map((o) => ({ value: o, label: OUTCOME_LABEL[o] }))

export type ScheduleInit = Partial<Reminder> & { type?: ReminderType; application_id?: string | null }

// Add or edit a reminder (prototype `ScheduleDialog`). `init.id` means editing.
// Left out until email/push exist (7.2): "Remind me … before" and "Also send to".
export default function ScheduleDialog({ init, onClose }: { init: ScheduleInit; onClose: () => void }) {
  const { data: apps = [] } = useApplications()
  const save = useSaveReminder()
  const del = useDeleteReminder()
  const editing = !!init.id
  const job = apps.find((a) => a.id === init.application_id)
  // Default type from the job's stage; default time: follow-ups a week after applying.
  const type0: ReminderType = init.type ?? (job?.status === 'interviewing' ? 'interview' : job?.status === 'offer' ? 'deadline' : 'follow')
  const start = init.due_at
    ? new Date(init.snoozed_until ?? init.due_at)
    : type0 === 'follow'
      ? plusDays(job && job.status !== 'saved' ? Math.max(1, 7 - jobDays(job)) : 3)
      : plusDays(1, type0 === 'interview' ? 14 : 9)
  const offerTitle = type0 === 'deadline' && job?.status === 'offer' ? 'Respond to the offer' : null

  const [d, setD] = useState({
    type: type0,
    application_id: init.application_id ?? '',
    title: init.title ?? offerTitle ?? DEF_TITLE[type0],
    date: toDateStr(start),
    time: toTimeStr(start),
    format: (init.interview_format ?? 'video') as InterviewFormat,
    where: init.interview_location ?? '',
    who: init.interviewer ?? '',
    outcome: (init.interview_outcome ?? 'pending') as InterviewOutcome,
    notes: init.notes ?? '',
  })
  const [err, setErr] = useState('')
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }))
  const linkedJob = apps.find((a) => a.id === d.application_id)

  // Switching type swaps in that type's default title, unless the title was edited.
  function pickType(t: ReminderType) {
    const untouched = !d.title || Object.values(DEF_TITLE).includes(d.title) || d.title === 'Respond to the offer'
    setD((x) => ({
      ...x,
      type: t,
      title: untouched ? (t === 'deadline' && linkedJob?.status === 'offer' ? 'Respond to the offer' : DEF_TITLE[t]) : x.title,
      time: t === 'interview' && x.time === '09:00' ? '14:00' : x.time,
    }))
  }

  const quick: [string, Date][] = [
    ['Today', plusDays(0)],
    ['Tomorrow', plusDays(1)],
    ['In 3 days', plusDays(3)],
    ['Next Monday', nextMonday()],
    ['In a week', plusDays(7)],
  ]

  async function submit() {
    if (!d.title.trim()) return setErr('Give it a short title, like “Follow up with Priya”.')
    const [y, m, dd] = d.date.split('-').map(Number)
    const [hh, mm] = d.time.split(':').map(Number)
    const due = new Date(y, m - 1, dd, hh, mm)
    if (Number.isNaN(due.getTime())) return setErr('Pick a date and time.')
    const interview = d.type === 'interview'
    const dueChanged = !editing || due.toISOString() !== new Date(init.snoozed_until ?? init.due_at!).toISOString()
    await save.mutateAsync({
      ...(editing ? { id: init.id } : {}),
      type: d.type,
      application_id: d.application_id || null,
      title: d.title.trim(),
      // A new time replaces any snooze.
      ...(dueChanged ? { due_at: due.toISOString(), snoozed_until: null } : {}),
      notes: d.notes.trim() || null,
      interview_format: interview ? d.format : null,
      interview_location: interview ? d.where.trim() || null : null,
      interviewer: interview ? d.who.trim() || null : null,
      interview_outcome: interview ? (editing ? d.outcome : 'pending') : null,
      // Recording an outcome on an interview also ticks it off.
      ...(interview && editing && d.outcome !== 'pending' && !init.done ? doneFields(true) : {}),
    })
    onClose()
  }

  async function remove() {
    if (!init.id || !confirm(`Delete “${init.title}”?`)) return
    await del.mutateAsync(init.id)
    onClose()
  }

  const error = err || save.error?.message || del.error?.message
  const choosable = apps.filter((a) => a.status !== 'closed' || a.id === init.application_id)

  return (
    <Dialog
      title={editing ? `Edit ${REMINDER_LABEL[d.type].toLowerCase()}` : d.type === 'interview' ? 'Schedule an interview' : 'Set a reminder'}
      description={linkedJob ? `${linkedJob.role} · ${linkedJob.company}` : 'Pick a job, a time, and what it’s for.'}
      onClose={onClose}
      width={580}
      footer={
        <>
          {editing && (
            <Button variant="ghost" icon={Trash2} onClick={remove} className="mr-auto text-coral-700 hover:enabled:bg-coral-100 hover:enabled:text-coral-700">
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : d.type === 'interview' ? 'Add interview' : 'Set reminder'}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Type" className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
        {REMINDER_TYPES.map((t) => {
          const on = d.type === t
          const { icon: Icon, tone } = REM_META[t]
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pickType(t)}
              className={`flex flex-col items-start gap-2.5 rounded-[14px] border-[1.5px] p-3 text-left transition-all hover:border-ink-300 ${
                on ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgb(35_70_217/0.12)]' : 'border-paper-200 bg-surface'
              }`}
            >
              <span className={`flex size-[30px] items-center justify-center rounded-[9px] ${tone}`}>
                <Icon size={16} />
              </span>
              <span className="text-[13px] font-semibold leading-[1.2] text-ink">{REMINDER_LABEL[t]}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        <Select
          id="sch-job"
          label="Job"
          value={d.application_id}
          onChange={(e) => set('application_id', e.target.value)}
          options={[{ value: '', label: 'Not linked to a job' }, ...choosable.map((a) => ({ value: a.id, label: `${a.company} · ${a.role}` }))]}
        />
        <Input
          id="sch-title"
          label="Title"
          value={d.title}
          onChange={(e) => {
            set('title', e.target.value)
            setErr('')
          }}
          placeholder={d.type === 'interview' ? 'e.g. Round 2 · System design' : 'e.g. Follow up with Priya'}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold leading-[1.2] text-ink">When</span>
        <div className="flex flex-wrap gap-1.5">
          {quick.map(([l, dt]) => (
            <FilterChip key={l} selected={d.date === toDateStr(dt)} onClick={() => set('date', toDateStr(dt))}>
              {l}
            </FilterChip>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
          <Input id="sch-date" type="date" icon={Calendar} aria-label="Date" value={d.date} onChange={(e) => set('date', e.target.value)} />
          <Input id="sch-time" type="time" icon={Clock} aria-label="Time" value={d.time} onChange={(e) => set('time', e.target.value)} />
        </div>
        <span className="text-xs text-ink-500">
          {d.date && new Date(`${d.date}T12:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at {d.time}, your
          local time
        </span>
      </div>

      {d.type === 'interview' && (
        <div className="flex flex-col gap-3 rounded-[14px] bg-paper-100 p-3.5">
          <Tabs variant="pill" value={d.format} onChange={(v) => set('format', v)} items={FORMATS} className="bg-surface" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <Input
              id="sch-where"
              inputSize="sm"
              label={d.format === 'video' ? 'Meeting link' : d.format === 'phone' ? 'Phone number' : 'Address'}
              icon={d.format === 'video' ? Video : d.format === 'phone' ? Phone : MapPin}
              value={d.where}
              onChange={(e) => set('where', e.target.value)}
              placeholder={d.format === 'video' ? 'Paste the call link' : d.format === 'phone' ? 'Who calls whom?' : 'Office address'}
            />
            <Input
              id="sch-who"
              inputSize="sm"
              label="With"
              icon={User}
              value={d.who}
              onChange={(e) => set('who', e.target.value)}
              placeholder="Interviewer name and role"
            />
            {editing && (
              <Select
                id="sch-outcome"
                selectSize="sm"
                label="Outcome"
                value={d.outcome}
                onChange={(e) => set('outcome', e.target.value as InterviewOutcome)}
                options={OUTCOMES}
              />
            )}
          </div>
        </div>
      )}

      <TextArea
        id="sch-note"
        label="Note"
        rows={3}
        value={d.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder={d.type === 'interview' ? 'What to prepare, questions to ask' : 'Anything to remember when it’s due'}
      />
      {error && <p className="text-sm text-coral-700">{error}</p>}
    </Dialog>
  )
}
