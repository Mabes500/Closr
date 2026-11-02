import { useQuery } from '@tanstack/react-query'
import { useApplications } from './applications'
import { useStatusEvents, type StatusEvent } from './events'
import { useProfile } from './profile'
import { localDate } from './stats'
import { supabase } from './supabase'
import { PACE_TARGET, type Application, type WeeklyPace } from './types'

// Weekly target and streak (roadmap 5.1). Days are 'YYYY-MM-DD' strings in the user's
// own time zone; weeks run Monday to Sunday.

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// The calendar day of a moment, in a time zone.
export function dayIn(tz: string, when: Date | string = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(when))
  } catch {
    return localDate(new Date(when))
  }
}

// Date-string arithmetic (done in UTC so no clock change can shift a day).
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const weekStart = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7))

// Paces in order, for the raise/lower target buttons.
export const PACE_ORDER: WeeklyPace[] = ['ease', 'steady', 'push']
export const targetFor = (pace: WeeklyPace) => PACE_TARGET[pace]

// The day each job was applied to: the date set on it, else when it first left Saved,
// else when it was added. Saved jobs aren't counted.
export function appliedDays(apps: Application[], events: StatusEvent[], tz: string) {
  const firstMove = new Map<string, string>()
  for (const e of events) {
    const cur = firstMove.get(e.application_id)
    if (!cur || e.occurred_at < cur) firstMove.set(e.application_id, e.occurred_at)
  }
  const days = new Map<string, string>()
  for (const a of apps) {
    if (a.status === 'saved') continue
    const moved = firstMove.get(a.id)
    days.set(a.id, a.applied_at ?? dayIn(tz, moved ?? a.created_at))
  }
  return days
}

// Applications per week for the last `weeks` weeks, oldest first; the last is this week.
export function weeklyApplied(days: Map<string, string>, today: string, weeks = 8) {
  const thisWeek = weekStart(today)
  const out = Array.from({ length: weeks }, (_, i) => ({ start: addDays(thisWeek, (i - weeks + 1) * 7), count: 0 }))
  for (const day of days.values()) {
    const w = out.find((x) => day >= x.start && day < addDays(x.start, 7))
    if (w) w.count++
  }
  return out
}

// Consecutive active days. Today counts once you've done something; until then a streak
// ending yesterday is still alive.
export function streakOf(active: Set<string>, today: string) {
  const activeToday = active.has(today)
  let day = activeToday ? today : addDays(today, -1)
  let streak = 0
  while (active.has(day)) {
    streak++
    day = addDays(day, -1)
  }
  return { streak, activeToday, startedOn: addDays(day, 1) }
}

// Everything the weekly target and streak need, in the user's saved time zone
// (falling back to the browser's until it's saved).
export function useWeekProgress() {
  const { data: apps } = useApplications()
  const { data: events } = useStatusEvents()
  const { data: profile } = useProfile()
  const { data: active } = useActivityDays()
  const tz = profile?.time_zone || browserTimeZone()
  const today = dayIn(tz)
  const pace = profile?.weekly_pace ?? 'steady'
  const days = apps && events ? appliedDays(apps, events, tz) : new Map<string, string>()
  const thisWeek = weekStart(today)
  const applied = [...days.values()].filter((d) => d >= thisWeek).length
  return {
    loaded: !!(apps && events && profile && active),
    tz,
    today,
    week: thisWeek,
    pace,
    target: targetFor(pace),
    applied,
    days,
    ...streakOf(active ?? new Set(), today),
  }
}

// Days you touched your search (written by the database; see the 5.1 migration).
// Nested under ['applications'] so job and reminder changes refresh it.
export function useActivityDays() {
  return useQuery({
    queryKey: ['applications', 'activity_days'],
    queryFn: async () => {
      const since = addDays(localDate(new Date()), -400)
      const { data, error } = await supabase.from('activity_days').select('day').gte('day', since)
      if (error) throw error
      return new Set((data as { day: string }[]).map((r) => r.day))
    },
  })
}
