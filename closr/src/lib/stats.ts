import type { StatusEvent } from './events'
import { SOURCE_LABEL, type Application, type ApplicationStatus } from './types'

// Reaching either of these counts as hearing back, even if it is later Closed.
const RESPONDED: ApplicationStatus[] = ['interviewing', 'offer']

export const NO_SOURCE = 'Not set'

export interface SourceRow {
  label: string
  count: number
  responded: number
}

export interface Stats {
  thisWeek: number
  lastWeek: number
  applied: number
  responded: number
  interviewing: number
  offers: number
  sources: SourceRow[]
}

// YYYY-MM-DD in the user's own timezone, comparable with `applied_at`.
export function localDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Weeks start on Monday.
function startOfWeek(now: Date, weeksAgo = 0) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - weeksAgo * 7)
  return localDate(d)
}

export function computeStats(apps: Application[], events: StatusEvent[], now = new Date()): Stats {
  const firstApplied = new Map<string, string>()
  const reached = new Set<string>()
  for (const e of events) {
    const day = localDate(new Date(e.occurred_at))
    const prev = firstApplied.get(e.application_id)
    if (!prev || day < prev) firstApplied.set(e.application_id, day)
    if (e.to_status && RESPONDED.includes(e.to_status)) reached.add(e.application_id)
  }

  const thisWeekStart = startOfWeek(now)
  const lastWeekStart = startOfWeek(now, 1)
  const stats: Stats = { thisWeek: 0, lastWeek: 0, applied: 0, responded: 0, interviewing: 0, offers: 0, sources: [] }
  const bySource = new Map<string, SourceRow>()

  for (const a of apps) {
    if (a.status === 'interviewing') stats.interviewing++
    if (a.status === 'offer') stats.offers++
    if (a.status === 'saved') continue

    stats.applied++
    // Apps dragged out of Saved have no applied_at, so fall back to when that move was logged.
    const day = a.applied_at ?? firstApplied.get(a.id) ?? localDate(new Date(a.created_at))
    if (day >= thisWeekStart) stats.thisWeek++
    else if (day >= lastWeekStart) stats.lastWeek++

    const responded = RESPONDED.includes(a.status) || reached.has(a.id)
    if (responded) stats.responded++

    const label = a.source ? SOURCE_LABEL[a.source] : NO_SOURCE
    const row = bySource.get(label.toLowerCase()) ?? { label, count: 0, responded: 0 }
    row.count++
    if (responded) row.responded++
    bySource.set(label.toLowerCase(), row)
  }

  stats.sources = [...bySource.values()].sort(
    (x, y) => Number(x.label === NO_SOURCE) - Number(y.label === NO_SOURCE) || y.count - x.count,
  )
  return stats
}
