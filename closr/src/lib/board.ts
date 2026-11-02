import { daysAgo } from './format'
import { whenDue, type ReminderWithApp } from './reminders'
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

// The next open reminder of any type, per application (prototype `nextRemFor`).
// Overdue ones come first, so a missed follow-up shows (in red) on the card.
export function nextReminders(reminders: ReminderWithApp[]) {
  const next = new Map<string, ReminderWithApp>()
  for (const r of reminders) {
    if (r.done || !r.application_id) continue
    const cur = next.get(r.application_id)
    if (!cur || whenDue(r) < whenDue(cur)) next.set(r.application_id, r)
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
