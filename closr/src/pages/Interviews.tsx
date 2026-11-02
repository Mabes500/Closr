import { useState } from 'react'
import InterviewDialog from '../components/InterviewDialog'
import InterviewRow from '../components/InterviewRow'
import { groupInterviews, useInterviews, type InterviewWithApp } from '../lib/interviews'
import type { Interview } from '../lib/types'

export default function Interviews() {
  const { data: interviews = [], isLoading, error } = useInterviews()
  const [editing, setEditing] = useState<Interview | 'new' | null>(null)
  const { next7, later, past } = groupInterviews(interviews)

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {next7.length} in the next 7 days · {next7.length + later.length} upcoming
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Add interview
        </button>
      </div>

      {error && <p className="text-sm text-status-rejected">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-8">
          <Section
            title="Next 7 days"
            accent
            items={next7}
            empty="Nothing in the next 7 days."
            onOpen={setEditing}
          />
          {later.length > 0 && <Section title="Later" items={later} onOpen={setEditing} />}
          {past.length > 0 && <Section title="Past" items={past} onOpen={setEditing} />}
        </div>
      )}

      {editing && (
        <InterviewDialog interview={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
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
  items: InterviewWithApp[]
  accent?: boolean
  empty?: string
  onOpen: (i: Interview) => void
}) {
  return (
    <section className={accent ? 'rounded-xl border border-line bg-surface/60 p-4' : ''}>
      <header className="mb-3 flex items-center gap-2 px-1">
        {accent && <span className="h-2 w-2 rounded-full bg-status-interviewing" />}
        <h2 className={`text-sm font-semibold ${accent ? '' : 'text-ink-muted'}`}>{title}</h2>
        <span className="font-mono text-xs text-ink-faint">{items.length}</span>
      </header>
      {items.length ? (
        <div className="flex flex-col gap-2">
          {items.map((i) => (
            <InterviewRow key={i.id} interview={i} onClick={() => onOpen(i)} />
          ))}
        </div>
      ) : (
        <p className="px-1 py-4 text-sm text-ink-faint">{empty}</p>
      )}
    </section>
  )
}
