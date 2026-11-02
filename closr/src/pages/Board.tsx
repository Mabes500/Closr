import { useState, type DragEvent } from 'react'
import { useApplications, useDeleteApplication, useMoveApplication } from '../lib/applications'
import { STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from '../lib/types'
import AddApplicationDialog from '../components/AddApplicationDialog'

export default function Board() {
  const { data: apps = [], isLoading, error } = useApplications()
  const move = useMoveApplication()
  const [adding, setAdding] = useState<ApplicationStatus | null>(null)
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)

  const onDrop = (status: ApplicationStatus) => (e: DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData('text/plain')
    const app = apps.find((a) => a.id === id)
    if (app && app.status !== status) move(id, status)
  }

  const active = apps.filter((a) => a.status !== 'saved' && a.status !== 'rejected').length

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your board</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {apps.length} applications · {active} in play
          </p>
        </div>
        <button
          onClick={() => setAdding('applied')}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Add application
        </button>
      </div>

      {error && <p className="text-sm text-status-rejected">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const items = apps.filter((a) => a.status === status)
            return (
              <section
                key={status}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(status)
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={onDrop(status)}
                className={`flex min-h-[60vh] flex-col rounded-xl border p-3 transition-colors ${
                  dragOver === status ? 'border-brand bg-brand-soft' : 'border-line bg-surface/60'
                }`}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: `var(--color-status-${status})` }} />
                    <h2 className="text-sm font-semibold">{STATUS_LABEL[status]}</h2>
                    <span className="font-mono text-xs text-ink-faint">{items.length}</span>
                  </div>
                  <button
                    onClick={() => setAdding(status)}
                    className="rounded px-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                    aria-label={`Add to ${STATUS_LABEL[status]}`}
                  >
                    +
                  </button>
                </header>
                <div className="flex flex-col gap-2">
                  {items.map((a) => (
                    <Card key={a.id} app={a} onMove={move} />
                  ))}
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-faint">Drop here</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {adding && <AddApplicationDialog defaultStatus={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

function Card({ app, onMove }: { app: Application; onMove: (id: string, s: ApplicationStatus) => void }) {
  const del = useDeleteApplication()
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
      className="group cursor-grab rounded-lg border border-line bg-surface p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{app.company}</p>
          <p className="truncate text-sm text-ink-muted">{app.role}</p>
        </div>
        {app.job_url && (
          <a href={app.job_url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
            Link
          </a>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
        {app.work_mode && <span className="rounded bg-canvas px-1.5 py-0.5 capitalize">{app.work_mode}</span>}
        {app.location && <span className="truncate">{app.location}</span>}
        {app.applied_at && <span className="ml-auto font-mono">{app.applied_at}</span>}
      </div>
      {/* Status select doubles as the mobile-friendly alternative to drag-and-drop. */}
      <div className="mt-2 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <select
          value={app.status}
          onChange={(e) => onMove(app.id, e.target.value as ApplicationStatus)}
          className="rounded border border-line bg-surface px-1 py-0.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          onClick={() => confirm(`Delete ${app.company} — ${app.role}?`) && del.mutate(app.id)}
          className="text-xs text-ink-faint hover:text-status-rejected"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
