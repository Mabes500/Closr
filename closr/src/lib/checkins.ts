import { useQuery } from '@tanstack/react-query'
import { useApplications } from './applications'
import { daysAgo } from './format'
import { supabase } from './supabase'
import type { Application } from './types'

// Check-ins (roadmap 4.2): jobs in Applied with no activity for 7+ days.

export const CHECKIN_DAYS = 7

// When each job last had something happen (a stage change, an interview logged...).
// Nested under ['applications'] so moving a job refreshes it.
function useLastActivity() {
  return useQuery({
    queryKey: ['applications', 'events', 'activity'],
    queryFn: async () => {
      const { data, error } = await supabase.from('application_events').select('application_id, occurred_at')
      if (error) throw error
      const last = new Map<string, string>()
      for (const e of data as { application_id: string; occurred_at: string }[]) {
        const cur = last.get(e.application_id)
        if (!cur || e.occurred_at > cur) last.set(e.application_id, e.occurred_at)
      }
      return last
    },
  })
}

export type Checkin = {
  app: Application
  // Days since applying, for "Applied to X 12 days ago".
  days: number
  // When it went quiet: the latest of applying, its last event, and the last "No reply yet".
  quietSince: string
}

export function checkinsDue(apps: Application[], last: Map<string, string>): Checkin[] {
  const out: Checkin[] = []
  for (const app of apps) {
    if (app.status !== 'applied') continue
    const times = [app.applied_at ? `${app.applied_at}T12:00:00` : app.created_at, last.get(app.id), app.checked_in_at]
    const quietSince = times
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).toISOString())
      .sort()
      .at(-1)!
    if (daysAgo(quietSince) < CHECKIN_DAYS) continue
    out.push({ app, days: daysAgo(app.applied_at ?? app.created_at), quietSince })
  }
  // Longest-waiting first.
  return out.sort((a, b) => b.days - a.days)
}

// The check-ins due now; `null` until jobs and their activity have loaded.
export function useCheckins() {
  const { data: apps } = useApplications()
  const { data: last } = useLastActivity()
  return apps && last ? checkinsDue(apps, last) : null
}
