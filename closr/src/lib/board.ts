import { daysAgo } from './format'
import type { InterviewWithApp } from './interviews'
import type { Application, ApplicationStatus } from './types'

// Badge colours per stage (prototype --stage-*-fg/bg/dot).
export const STAGE_BADGE: Record<ApplicationStatus, { badge: string; dot: string }> = {
  saved: { badge: 'bg-paper-200 text-ink-700', dot: 'bg-ink-400' },
  applied: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  interviewing: { badge: 'bg-gold-100 text-gold-800', dot: 'bg-gold-500' },
  offer: { badge: 'bg-mint-100 text-mint-700', dot: 'bg-mint-600' },
  closed: { badge: 'bg-oxford-100 text-oxford-600', dot: 'bg-oxford-300' },
}

export const STALE_DAYS = 14

// Days since applying (or saving, for Saved jobs).
export const jobDays = (a: Application) => daysAgo(a.applied_at ?? a.created_at)

// Applied, and no movement for two weeks (prototype `isStale`).
export const isStale = (a: Application) => a.status === 'applied' && jobDays(a) >= STALE_DAYS

// The soonest interview from today on that's still pending, per application.
// Stands in for the prototype's "next reminder" until reminders arrive (Phase 3).
export function nextInterviews(interviews: InterviewWithApp[], now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const next = new Map<string, InterviewWithApp>()
  for (const i of interviews) {
    if (i.outcome !== 'pending' || new Date(i.scheduled_at) < today) continue
    const cur = next.get(i.application_id)
    if (!cur || i.scheduled_at < cur.scheduled_at) next.set(i.application_id, i)
  }
  return next
}

// "Today", "Tomorrow", "Yesterday" or "Thu 5 Nov" (prototype `relDay`).
export function relDay(iso: string) {
  const n = -daysAgo(iso)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
