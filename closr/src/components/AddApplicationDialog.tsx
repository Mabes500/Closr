import { useState, type FormEvent } from 'react'
import { useCreateApplication } from '../lib/applications'
import { STATUSES, STATUS_LABEL, type ApplicationStatus, type WorkMode } from '../lib/types'

const field = 'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-brand'

export default function AddApplicationDialog({
  defaultStatus = 'applied',
  onClose,
}: {
  defaultStatus?: ApplicationStatus
  onClose: () => void
}) {
  const create = useCreateApplication()
  const [form, setForm] = useState({
    company: '',
    role: '',
    job_url: '',
    location: '',
    work_mode: '' as WorkMode | '',
    source: '',
    status: defaultStatus,
    applied_at: new Date().toISOString().slice(0, 10),
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    await create.mutateAsync({
      company: form.company.trim(),
      role: form.role.trim(),
      job_url: form.job_url.trim() || null,
      location: form.location.trim() || null,
      work_mode: form.work_mode || null,
      source: form.source.trim() || null,
      status: form.status,
      applied_at: form.status === 'saved' ? null : form.applied_at || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Add application</h2>
        <input autoFocus required placeholder="Company" className={field} value={form.company} onChange={set('company')} />
        <input required placeholder="Role" className={field} value={form.role} onChange={set('role')} />
        <input type="url" placeholder="Job link (optional)" className={field} value={form.job_url} onChange={set('job_url')} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Location" className={field} value={form.location} onChange={set('location')} />
          <select className={field} value={form.work_mode} onChange={set('work_mode')}>
            <option value="">Work mode</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
        {/* Free text with suggestions, so people can name any board or referrer. */}
        <input list="sources" placeholder="Source (LinkedIn, referral…)" className={field} value={form.source} onChange={set('source')} />
        <datalist id="sources">
          {['LinkedIn', 'Referral', 'Company site', 'Indeed', 'Wellfound', 'Recruiter'].map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-3">
          <select className={field} value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          {form.status !== 'saved' && (
            <input type="date" className={field} value={form.applied_at} onChange={set('applied_at')} />
          )}
        </div>
        {create.error && <p className="text-sm text-status-rejected">{create.error.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
            Cancel
          </button>
          <button
            disabled={create.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {create.isPending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
