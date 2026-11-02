import type { StatusEvent } from './events'
import type { Application } from './types'

// Response rates from your own jobs, used by CV Versions (4.1) and Goals (5.2).

// YYYY-MM-DD in the browser's timezone, comparable with `applied_at`.
export function localDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Below this many applications a group's response rate says little.
export const MIN_TO_COMPARE = 5

export type GroupStats = { sent: number; responses: number; interviews: number; rate: number | null }

// Per group (a source, a CV version...): jobs sent (anything past Saved), responses
// (moved past Applied: reached Interviewing or Offer, or closed as Rejected; closed as
// "No response" or "Withdrew" doesn't count), interviews (reached Interviewing or
// Offer), and the response rate. Jobs whose group is null are left out.
export function groupStats(apps: Application[], events: StatusEvent[], groupOf: (a: Application) => string | null) {
  const reachedInterview = new Set(
    events.filter((e) => e.to_status === 'interviewing' || e.to_status === 'offer').map((e) => e.application_id),
  )
  const stats = new Map<string, GroupStats>()
  for (const a of apps) {
    const g = groupOf(a)
    if (g == null || a.status === 'saved') continue
    const s = stats.get(g) ?? { sent: 0, responses: 0, interviews: 0, rate: null }
    const interviewed = a.status === 'interviewing' || a.status === 'offer' || reachedInterview.has(a.id)
    s.sent++
    if (interviewed) s.interviews++
    if (interviewed || (a.status === 'closed' && a.close_reason === 'rejected')) s.responses++
    s.rate = s.responses / s.sent
    stats.set(g, s)
  }
  return stats
}
