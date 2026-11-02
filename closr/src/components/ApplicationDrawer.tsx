import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteApplication, useUpdateApplication } from '../lib/applications'
import { isStale, jobDays } from '../lib/board'
import { useApplicationHistory } from '../lib/events'
import { ago, daysAgo } from '../lib/format'
import { groupInterviews, useInterviews } from '../lib/interviews'
import {
  CLOSE_REASON_LABEL,
  INTERVIEW_ORIGINS,
  INTERVIEW_ORIGIN_LABEL,
  JOB_CHANNELS,
  SOURCE_LABEL,
  STATUSES,
  STATUS_LABEL,
  VISA_OPTIONS,
  VISA_LABEL,
  type Application,
  type ApplicationEvent,
  type ApplicationStatus,
  type Interview,
} from '../lib/types'
import ApplicationContacts from './ApplicationContacts'
import InterviewDialog from './InterviewDialog'
import InterviewRow from './InterviewRow'
import SalaryInput, { salaryDraft, salaryValues } from './SalaryInput'
import { CompanyTile, Drawer, Field, Input, SectionTitle, Select, Tabs, TextArea } from './ui'

const MODE_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
]
const VISA_SELECT = VISA_OPTIONS.map((v) => ({ value: v, label: VISA_LABEL[v] }))
const SOURCE_SELECT = [{ value: '', label: 'Not set' }, ...JOB_CHANNELS.map((c) => ({ value: c, label: SOURCE_LABEL[c] }))]
const ORIGIN_SELECT = [
  { value: '', label: 'Not recorded' },
  ...[...INTERVIEW_ORIGINS, 'other' as const].map((c) => ({ value: c, label: INTERVIEW_ORIGIN_LABEL[c] })),
]

// Job detail panel (prototype `JobDrawer`). Every field saves as you go: text boxes
// when you leave them, menus straight away. Stage changes go through the board so
// Closed asks for a reason and Interviewing asks what got you the interview.
export default function ApplicationDrawer({
  app,
  onClose,
  onChangeStatus,
  escapeEnabled = true,
}: {
  app: Application
  onClose: () => void
  onChangeStatus: (id: string, status: ApplicationStatus) => void
  escapeEnabled?: boolean
}) {
  const update = useUpdateApplication()
  const remove = useDeleteApplication()
  const { data: allInterviews = [] } = useInterviews()
  const [editing, setEditing] = useState<Interview | 'new' | null>(null)
  const [salary, setSalary] = useState(() => salaryDraft(app))
  const { next7, later } = groupInterviews(allInterviews.filter((i) => i.application_id === app.id))
  const upcoming = [...next7, ...later]

  const save = (patch: Partial<Application>) => update.mutate({ id: app.id, ...patch })
  // Text boxes: save on leaving the box, only if something changed; empty means "not set".
  const text = (field: 'location' | 'time_zone' | 'next_action' | 'notes') => ({
    defaultValue: app[field] ?? '',
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value.trim() || null
      if (v !== app[field]) save({ [field]: v })
    },
  })

  const sinceDays = jobDays(app)
  const stale = isStale(app)
  const showOrigin = app.interview_origin != null || app.status === 'interviewing' || app.status === 'offer'

  return (
    <Drawer
      title={app.role}
      subtitle={app.source ? `${app.company} · via ${SOURCE_LABEL[app.source]}` : app.company}
      leading={<CompanyTile name={app.company} size={40} />}
      onClose={onClose}
      escapeEnabled={escapeEnabled && !editing}
    >
      <div>
        <Tabs
          variant="pill"
          items={STATUSES.map((s) => ({ value: s, label: s === 'interviewing' ? 'Interview' : STATUS_LABEL[s] }))}
          value={app.status}
          onChange={(s) => onChangeStatus(app.id, s)}
          className="grid w-full grid-cols-5"
        />
        {app.status === 'closed' && (
          <p className="mx-0.5 mt-2.5 text-[13px] text-ink-500">
            Closed: {app.close_reason ? CLOSE_REASON_LABEL[app.close_reason] : 'no reason recorded'}
          </p>
        )}
        {/* The prototype links "Set a follow-up" here; follow-ups arrive with Schedule (Phase 3). */}
        {stale && (
          <p className="mx-0.5 mt-2.5 text-[13px] font-medium text-gold-800">No reply in {sinceDays} days. Follow up or close it.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5">
        <Select
          id={`dm-${app.id}`}
          selectSize="sm"
          label="Work mode"
          value={app.work_mode ?? ''}
          onChange={(e) => save({ work_mode: (e.target.value || null) as Application['work_mode'] })}
          options={MODE_OPTIONS}
        />
        <Input key={`dl-${app.id}`} id={`dl-${app.id}`} inputSize="sm" label="Location" placeholder="e.g. London, UK" {...text('location')} />
        <Input
          key={`dt-${app.id}`}
          id={`dt-${app.id}`}
          inputSize="sm"
          label="Time zones"
          placeholder="e.g. UTC+0 to UTC+2"
          className="font-mono text-[13px]"
          {...text('time_zone')}
        />
        <Select
          id={`dv-${app.id}`}
          selectSize="sm"
          label="Visa sponsorship"
          value={app.visa_sponsorship}
          onChange={(e) => save({ visa_sponsorship: e.target.value as Application['visa_sponsorship'] })}
          options={VISA_SELECT}
        />
        <SalaryInput
          id={`ds-${app.id}`}
          label="Salary / yr"
          value={salary}
          onChange={setSalary}
          onBlur={() => {
            const v = salaryValues(salary)
            if (v.salary_min !== app.salary_min || v.salary_max !== app.salary_max || v.salary_currency !== app.salary_currency) save(v)
          }}
        />
        <Field label={app.status === 'saved' ? 'Saved' : 'Applied'}>{ago(sinceDays)}</Field>
        <Select
          id={`dsrc-${app.id}`}
          selectSize="sm"
          label="Source"
          value={app.source ?? ''}
          onChange={(e) => save({ source: (e.target.value || null) as Application['source'] })}
          options={SOURCE_SELECT}
        />
        {showOrigin && (
          <Select
            id={`do-${app.id}`}
            selectSize="sm"
            label="What got you the interview"
            value={app.interview_origin ?? ''}
            onChange={(e) => save({ interview_origin: (e.target.value || null) as Application['interview_origin'] })}
            options={ORIGIN_SELECT}
          />
        )}
        <Input
          key={`dn-${app.id}`}
          id={`dn-${app.id}`}
          inputSize="sm"
          label="Next action"
          placeholder="e.g. Follow up with the recruiter on Friday"
          wrapClassName="col-span-full"
          {...text('next_action')}
        />
        <TextArea
          key={`dnotes-${app.id}`}
          id={`dnotes-${app.id}`}
          label="Notes"
          placeholder="Anything worth remembering for the interview"
          wrapClassName="col-span-full"
          {...text('notes')}
        />
        {app.job_url && (
          <Field label="Posting" full>
            <a href={app.job_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              {app.job_url}
            </a>
          </Field>
        )}
      </div>
      {update.error && <p className="text-sm text-coral-700">{update.error.message}</p>}

      {/* Interviews stay here until they fold into Schedule reminders (Phase 3). */}
      <div>
        <SectionTitle
          right={
            <button onClick={() => setEditing('new')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              + Add interview
            </button>
          }
        >
          Interviews
        </SectionTitle>
        {upcoming.length ? (
          <div className="flex flex-col gap-2">
            {upcoming.map((i) => (
              <InterviewRow key={i.id} interview={i} showCompany={false} onClick={() => setEditing(i)} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-500">Nothing scheduled.</p>
        )}
      </div>

      <ApplicationContacts app={app} />
      <History applicationId={app.id} />

      {/* Cards no longer carry a Delete button (as in the prototype), so it lives here. */}
      <div className="border-t border-paper-200 pt-4">
        <button
          type="button"
          onClick={() => {
            if (!confirm(`Delete ${app.role} at ${app.company}? This can't be undone.`)) return
            remove.mutate(app.id)
            onClose()
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-coral-700 hover:bg-coral-100"
        >
          <Trash2 size={15} />
          Delete job
        </button>
      </div>

      {editing && (
        <InterviewDialog interview={editing === 'new' ? undefined : editing} applicationId={app.id} onClose={() => setEditing(null)} />
      )}
    </Drawer>
  )
}

function eventLabel(e: ApplicationEvent) {
  if (e.type === 'interview') return `Interview${e.note ? ` · ${e.note}` : ''}`
  if (!e.to_status) return null
  const label = STATUS_LABEL[e.to_status]
  return e.close_reason ? `${label} · ${CLOSE_REASON_LABEL[e.close_reason]}` : label
}

function when(occurredAt: string) {
  const d = daysAgo(occurredAt)
  return d < 0 ? `in ${-d}d` : ago(d)
}

// Timeline from application_events (prototype "History"); the latest entry is highlighted.
function History({ applicationId }: { applicationId: string }) {
  const { data: events = [] } = useApplicationHistory(applicationId)
  const rows = events.flatMap((e) => {
    const label = eventLabel(e)
    return label ? [{ id: e.id, label, when: when(e.occurred_at) }] : []
  })
  if (!rows.length) return null
  return (
    <div>
      <SectionTitle>History</SectionTitle>
      {rows.map((r, i) => (
        <div key={r.id} className="grid grid-cols-[14px_1fr_auto] items-center gap-2.5 py-1.5 text-[13px]">
          <i className={`size-2 rounded-full ${i === rows.length - 1 ? 'bg-blue-600' : 'bg-paper-300'}`} />
          <span className="text-ink">{r.label}</span>
          <span className="text-ink-500">{r.when}</span>
        </div>
      ))}
    </div>
  )
}
