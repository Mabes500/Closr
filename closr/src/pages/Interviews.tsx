import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import InterviewDialog from '../components/InterviewDialog'
import { Button, TopBar } from '../components/ui'
import InterviewRow from '../components/InterviewRow'
import { groupInterviews, useInterviews, type InterviewWithApp } from '../lib/interviews'
import type { Interview } from '../lib/types'

export default function Interviews() {
  const { data: interviews = [], isLoading, error } = useInterviews()
  const [editing, setEditing] = useState<Interview | 'new' | null>(null)
  const { next7, later, past } = groupInterviews(interviews)

  return (
    <div className="w-full max-w-3xl">
      {/* Interviews fold into Schedule in Phase 3; until then this page hangs off it. */}
      <Link
        to="/schedule"
        className="-ml-0.5 mb-3 inline-flex items-center gap-1.5 rounded-lg py-1.5 pl-0.5 pr-2 text-sm font-semibold leading-none text-ink-500 hover:bg-paper-100 hover:text-ink"
      >
        <ArrowLeft size={16} />
        Schedule
      </Link>
      <div className="mb-6">
        <TopBar title="Interviews" sub={`${next7.length} in the next 7 days · ${next7.length + later.length} upcoming`}>
          <Button onClick={() => setEditing('new')}>+ Add interview</Button>
        </TopBar>
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
