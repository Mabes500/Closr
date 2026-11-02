import { useEffect, useState } from 'react'
import { groupInterviews, useInterviews } from '../lib/interviews'
import { CLOSE_REASON_LABEL, STATUS_LABEL, type Application, type Interview } from '../lib/types'
import ApplicationContacts from './ApplicationContacts'
import InterviewDialog from './InterviewDialog'
import InterviewRow from './InterviewRow'

// Side panel for one application. For now it shows the basics, interviews and contacts;
// notes, timeline and field editing (roadmap item 2) will be added here.
export default function ApplicationDrawer({ app, onClose }: { app: Application; onClose: () => void }) {
  const { data: all = [], isLoading } = useInterviews()
  const [editing, setEditing] = useState<Interview | 'new' | null>(null)
  const { next7, later, past } = groupInterviews(all.filter((i) => i.application_id === app.id))
  const upcoming = [...next7, ...later]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !editing && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{app.company}</h2>
            <p className="truncate text-sm text-ink-muted">{app.role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5 rounded bg-canvas px-1.5 py-0.5 text-ink">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--color-status-${app.status})` }} />
                {STATUS_LABEL[app.status]}
                {app.close_reason && ` · ${CLOSE_REASON_LABEL[app.close_reason]}`}
              </span>
              {app.work_mode && <span className="rounded bg-canvas px-1.5 py-0.5 capitalize">{app.work_mode}</span>}
              {app.location && <span>{app.location}</span>}
              {app.source && <span>via {app.source}</span>}
              {app.applied_at && <span className="font-mono">{app.applied_at}</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded px-1.5 text-ink-faint hover:bg-canvas hover:text-ink" aria-label="Close">
            ✕
          </button>
        </header>

        <section className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Upcoming interviews</h3>
            <button onClick={() => setEditing('new')} className="text-sm font-medium text-brand hover:underline">
              + Add interview
            </button>
          </div>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : upcoming.length ? (
            <div className="flex flex-col gap-2">
              {upcoming.map((i) => (
                <InterviewRow key={i.id} interview={i} showCompany={false} onClick={() => setEditing(i)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint">Nothing scheduled.</p>
          )}

          {past.length > 0 && (
            <>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-ink-muted">Past</h3>
              <div className="flex flex-col gap-2">
                {past.map((i) => (
                  <InterviewRow key={i.id} interview={i} showCompany={false} onClick={() => setEditing(i)} />
                ))}
              </div>
            </>
          )}
        </section>

        <ApplicationContacts app={app} />
      </aside>

      {editing && (
        <InterviewDialog
          interview={editing === 'new' ? undefined : editing}
          applicationId={app.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
