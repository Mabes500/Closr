import { useState, type FormEvent } from 'react'
import { useApplications } from '../lib/applications'
import { useCreateInterview, useDeleteInterview, useUpdateInterview } from '../lib/interviews'
import {
  FORMAT_LABEL,
  INTERVIEW_FORMATS,
  INTERVIEW_OUTCOMES,
  OUTCOME_LABEL,
  type Interview,
  type InterviewFormat,
  type InterviewOutcome,
} from '../lib/types'

const field = 'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-brand'

// <input type="datetime-local"> works in local time without a timezone, so convert both ways.
function toLocalInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// Add or edit an interview. Pass `interview` to edit, or `applicationId` to add one
// for a known application; with neither, the user picks the application.
export default function InterviewDialog({
  interview,
  applicationId,
  onClose,
}: {
  interview?: Interview
  applicationId?: string
  onClose: () => void
}) {
  const { data: apps = [] } = useApplications()
  const create = useCreateInterview()
  const update = useUpdateInterview()
  const del = useDeleteInterview()
  const [form, setForm] = useState({
    application_id: interview?.application_id ?? applicationId ?? '',
    round_name: interview?.round_name ?? '',
    scheduled_at: interview ? toLocalInput(interview.scheduled_at) : '',
    format: (interview?.format ?? '') as InterviewFormat | '',
    interviewer: interview?.interviewer ?? '',
    notes: interview?.notes ?? '',
    outcome: interview?.outcome ?? ('pending' as InterviewOutcome),
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const error = create.error ?? update.error ?? del.error

  async function submit(e: FormEvent) {
    e.preventDefault()
    const values = {
      application_id: form.application_id,
      round_name: form.round_name.trim(),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      format: form.format || null,
      interviewer: form.interviewer.trim() || null,
      notes: form.notes.trim() || null,
      outcome: form.outcome,
    }
    if (interview) await update.mutateAsync({ id: interview.id, ...values })
    else await create.mutateAsync(values)
    onClose()
  }

  async function remove() {
    if (!interview || !confirm(`Delete ${interview.round_name}?`)) return
    await del.mutateAsync(interview.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">{interview ? 'Edit interview' : 'Add interview'}</h2>
        {!interview && !applicationId && (
          <select required className={field} value={form.application_id} onChange={set('application_id')}>
            <option value="">Which application?</option>
            {[...apps]
              .sort((a, b) => a.company.localeCompare(b.company))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company} — {a.role}
                </option>
              ))}
          </select>
        )}
        <input
          autoFocus
          required
          placeholder="Round (e.g. Recruiter screen, Technical, Final)"
          className={field}
          value={form.round_name}
          onChange={set('round_name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <input required type="datetime-local" className={field} value={form.scheduled_at} onChange={set('scheduled_at')} />
          <select className={field} value={form.format} onChange={set('format')}>
            <option value="">Format</option>
            {INTERVIEW_FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL[f]}
              </option>
            ))}
          </select>
        </div>
        <input placeholder="Interviewer (optional)" className={field} value={form.interviewer} onChange={set('interviewer')} />
        <textarea placeholder="Notes (optional)" rows={3} className={field} value={form.notes} onChange={set('notes')} />
        <select className={field} value={form.outcome} onChange={set('outcome')}>
          {INTERVIEW_OUTCOMES.map((o) => (
            <option key={o} value={o}>
              Outcome: {OUTCOME_LABEL[o]}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-status-rejected">{error.message}</p>}
        <div className="flex items-center gap-2 pt-2">
          {interview && (
            <button type="button" onClick={remove} className="text-sm text-ink-faint hover:text-status-rejected">
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
            Cancel
          </button>
          <button
            disabled={create.isPending || update.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {create.isPending || update.isPending ? 'Saving…' : interview ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
