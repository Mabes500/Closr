import { useState, type DragEvent } from 'react'
import { useApplications, useDeleteApplication, useMoveApplication, useUpdateApplication } from '../lib/applications'
import { CLOSE_REASON_LABEL, STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from '../lib/types'
import AddJobModal from '../components/AddJobModal'
import StatsStrip from '../components/StatsStrip'
import ApplicationDrawer from '../components/ApplicationDrawer'
import ChannelModal from '../components/ChannelModal'
import ReasonModal from '../components/ReasonModal'
import { Button, TopBar } from '../components/ui'

export default function Board() {
  const { data: apps = [], isLoading, error } = useApplications()
  const move = useMoveApplication()
  const update = useUpdateApplication()
  const [adding, setAdding] = useState<ApplicationStatus | null>(null)
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [closing, setClosing] = useState<Application | null>(null)
  const [asking, setAsking] = useState<Application | null>(null)
  const openApp = apps.find((a) => a.id === openId)

  // Moving to Closed asks for a reason first; cancelling leaves the card where it was.
  // Moving to Interviewing asks what got you the interview (skippable), once per job.
  const changeStatus = (id: string, status: ApplicationStatus) => {
    const app = apps.find((a) => a.id === id)
    if (!app || app.status === status) return
    if (status === 'closed') return setClosing(app)
    move(id, status)
    if (status === 'interviewing' && !app.interview_origin) setAsking(app)
  }

  const onDrop = (status: ApplicationStatus) => (e: DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    changeStatus(e.dataTransfer.getData('text/plain'), status)
  }

  const active = apps.filter((a) => a.status !== 'saved' && a.status !== 'closed').length

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <TopBar title="Board" sub={`${apps.length} jobs · ${active} in play`}>
          <Button onClick={() => setAdding('applied')}>+ Add a job</Button>
        </TopBar>
      </div>

      {error && <p className="text-sm text-status-rejected">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
        <StatsStrip apps={apps} />
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
                  {/* New jobs can't start out Closed: closing one needs a reason. */}
                  {status !== 'closed' && (
                    <button
                      onClick={() => setAdding(status)}
                      className="rounded px-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                      aria-label={`Add to ${STATUS_LABEL[status]}`}
                    >
                      +
                    </button>
                  )}
                </header>
                <div className="flex flex-col gap-2">
                  {items.map((a) => (
                    <Card key={a.id} app={a} onMove={changeStatus} onOpen={() => setOpenId(a.id)} />
                  ))}
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-faint">Drop here</p>}
                </div>
              </section>
            )
          })}
        </div>
        </>
      )}

      {adding && <AddJobModal column={adding} onClose={() => setAdding(null)} />}
      {openApp && (
        <ApplicationDrawer
          app={openApp}
          onClose={() => setOpenId(null)}
          onChangeStatus={changeStatus}
          escapeEnabled={!closing && !asking}
        />
      )}
      {asking && (
        <ChannelModal
          app={asking}
          onPick={(origin) => {
            update.mutate({ id: asking.id, interview_origin: origin })
            setAsking(null)
          }}
          onClose={() => setAsking(null)}
        />
      )}
      {closing && (
        <ReasonModal
          app={closing}
          onPick={(reason) => {
            move(closing.id, 'closed', reason)
            setClosing(null)
          }}
          onClose={() => setClosing(null)}
        />
      )}
    </div>
  )
}

function Card({
  app,
  onMove,
  onOpen,
}: {
  app: Application
  onMove: (id: string, s: ApplicationStatus) => void
  onOpen: () => void
}) {
  const del = useDeleteApplication()
  const closed = app.status === 'closed'
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
      // Clicks on the card's own link, status select and delete button shouldn't open the drawer.
      onClick={(e) => !(e.target as HTMLElement).closest('a, button, select') && onOpen()}
      // Closed cards are dimmed, as in the prototype's JobCard.
      className={`group cursor-grab rounded-lg border border-line bg-surface p-3 shadow-sm active:cursor-grabbing ${closed ? 'opacity-[.72]' : ''}`}
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
        {app.applied_at && !closed && <span className="ml-auto font-mono">{app.applied_at}</span>}
      </div>
      {/* JobCard's footer shows the close reason in place of the applied date. */}
      {closed && (
        <p className="mt-2 text-xs text-ink-500">{app.close_reason ? CLOSE_REASON_LABEL[app.close_reason] : 'Closed'}</p>
      )}
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
