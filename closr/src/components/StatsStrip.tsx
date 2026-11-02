import { useStatusEvents } from '../lib/events'
import { computeStats, NO_SOURCE, type SourceRow } from '../lib/stats'
import type { Application } from '../lib/types'

const MAX_SOURCES = 4

export default function StatsStrip({ apps }: { apps: Application[] }) {
  const { data: events = [] } = useStatusEvents()
  const s = computeStats(apps, events)
  const rate = s.applied ? Math.round((s.responded / s.applied) * 100) : null

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.6fr)]">
      <Tile accent="applied" label="Applied this week" value={s.thisWeek} hint={`${s.lastWeek} last week`} />
      <Tile
        accent="offer"
        label="Response rate"
        value={rate === null ? '—' : `${rate}%`}
        hint={`${s.responded} of ${s.applied} heard back`}
      />
      <Tile
        accent="interviewing"
        label="Interviews in progress"
        value={s.interviewing}
        hint={`${s.offers} ${s.offers === 1 ? 'offer' : 'offers'}`}
      />
      <Sources rows={s.sources} total={s.applied} />
    </div>
  )
}

function Tile({ accent, label, value, hint }: { accent: string; label: string; value: number | string; hint: string }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: `var(--color-status-${accent})` }} />
        <h2 className="text-xs font-medium text-ink-muted">{label}</h2>
      </div>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 font-mono text-xs text-ink-faint">{hint}</p>
    </section>
  )
}

function Sources({ rows, total }: { rows: SourceRow[]; total: number }) {
  // Keep the card compact: top sources, then everything else folded into "Other".
  const named = rows.filter((r) => r.label !== NO_SOURCE)
  const unset = rows.find((r) => r.label === NO_SOURCE)
  const shown = named.slice(0, MAX_SOURCES)
  const rest = named.slice(MAX_SOURCES)
  if (rest.length)
    shown.push({
      label: 'Other',
      count: rest.reduce((n, r) => n + r.count, 0),
      responded: rest.reduce((n, r) => n + r.responded, 0),
    })
  if (unset) shown.push(unset)

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:col-span-3 lg:col-span-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-ink-muted">By source</h2>
        <span className="font-mono text-xs text-ink-faint">count · replied</span>
      </div>
      {total === 0 ? (
        <p className="mt-3 text-xs text-ink-faint">Sources show up once you've applied somewhere.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((r) => (
            <li key={r.label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
              <span className={`truncate ${r.label === NO_SOURCE ? 'text-ink-faint' : ''}`}>{r.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-canvas">
                <span
                  className={`block h-full rounded-full ${r.label === NO_SOURCE ? 'bg-line-strong' : 'bg-brand'}`}
                  style={{ width: `${(r.count / total) * 100}%` }}
                />
              </span>
              <span className="font-mono text-xs">
                {r.count}
                <span className="text-ink-faint"> · {Math.round((r.responded / r.count) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {total > 0 && !named.length && (
        <p className="mt-3 text-xs text-ink-faint">Add a source when you log an application to see which ones get replies.</p>
      )}
    </section>
  )
}
