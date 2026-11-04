// Which emails someone is due right now (roadmap 7.2). No database or network here.
//
// Every item has a dedupe key; the sender skips keys already in email_log. Quiet hours
// hold everything except interview reminders until the next hourly run after they end.

export type EmailKind = 'followup' | 'interview' | 'reminders' | 'checkin' | 'matches' | 'recap'

export interface EmailItem {
  kind: EmailKind
  key: string
  title: string
  detail?: string
  url?: string
}

export interface Person {
  id: string
  time_zone: string | null
  notification_prefs: Partial<Record<EmailKind, { app?: boolean; email?: boolean }>> | null
  quiet_hours: boolean
  quiet_from: string
  quiet_to: string
  checkin_day: string
  checkin_time: string
}

export interface ReminderRow {
  id: string
  type: 'follow' | 'interview' | 'deadline' | 'custom'
  title: string
  due_at: string
  snoozed_until: string | null
  application_id: string | null
  application: { company: string; role: string } | null
}

export interface QuietJob {
  id: string
  company: string
  role: string
  days: number
}

export interface MatchRow {
  id: string
  match_date: string
  posting: { id: string; title: string; company: string; location: string | null; closed_at: string | null } | null
}

export interface Recap {
  month: string // 2026-10
  label: string // October 2026
  applied: number
  responses: number
  interviews: number
}

export interface Input {
  person: Person
  reminders: ReminderRow[]
  quiet: QuietJob[]
  matches: MatchRow[]
  activeDays: Set<string>
  recap: Recap | null
  appUrl: string
  now?: Date
}

const HOUR = 3_600_000
const DAY = 24 * HOUR
const LOOKBACK = 7 * DAY // older overdue items aren't worth a first email
const STREAK_MILESTONES = new Set([7, 14, 30, 50, 75, 100, 150, 200, 365])
const DIGEST_TIME = '09:00'
const MATCH_DAYS = new Set(['Monday', 'Thursday']) // "at most twice a week"
const MATCHES_IN_DIGEST = 5

// The person's clock: date, weekday and time in their time zone.
export function clock(tz: string | null, now: Date) {
  const parts = (zone: string) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    )
  let p: Record<string, string>
  try {
    p = parts(tz ?? 'UTC')
  } catch {
    p = parts('UTC')
  }
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, time: `${p.hour}:${p.minute}`, dayOfMonth: Number(p.day) }
}

// "22:00" to "07:00" runs past midnight; "01:00" to "05:00" doesn't.
export function inQuietHours(time: string, from: string, to: string) {
  if (from === to) return false
  return from < to ? time >= from && time < to : time >= from || time < to
}

export function whenLabel(iso: string, tz: string | null) {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
  try {
    return format(tz ?? 'UTC')
  } catch {
    return format('UTC')
  }
}

const addDay = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function streakLength(active: Set<string>, today: string) {
  let n = 0
  for (let d = today; active.has(d); d = addDay(d, -1)) n++
  return n
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function itemsDue({ person, reminders, quiet, matches, activeDays, recap, appUrl, now = new Date() }: Input): EmailItem[] {
  const tz = person.time_zone
  const local = clock(tz, now)
  const wants = (k: EmailKind) => person.notification_prefs?.[k]?.email === true
  const items: EmailItem[] = []

  for (const r of reminders) {
    const due = r.snoozed_until ?? r.due_at
    const ms = new Date(due).getTime() - now.getTime()
    const company = r.application?.company
    const detail = (prefix: string) => `${prefix} ${whenLabel(due, tz)} (your time)`
    const key = `${r.type}:${r.id}:${due}`
    if (r.type === 'interview' && wants('interview') && ms >= 0 && ms <= DAY)
      items.push({ kind: 'interview', key, title: company ? `Interview with ${company}: ${r.title}` : `Interview: ${r.title}`, detail: detail('Starts'), url: `${appUrl}/schedule` })
    else if (r.type === 'follow' && wants('followup') && ms <= 0 && ms >= -LOOKBACK)
      items.push({ kind: 'followup', key, title: company ? `Follow up with ${company}` : r.title, detail: detail('Was due'), url: `${appUrl}/schedule` })
    else if (r.type === 'deadline' && wants('reminders') && ms <= DAY && ms >= -LOOKBACK)
      items.push({ kind: 'reminders', key, title: company ? `${company}: ${r.title}` : r.title, detail: detail(ms >= 0 ? 'Due' : 'Was due'), url: `${appUrl}/schedule` })
    else if (r.type === 'custom' && wants('reminders') && ms <= 0 && ms >= -LOOKBACK)
      items.push({ kind: 'reminders', key, title: company ? `${company}: ${r.title}` : r.title, detail: detail('Was due'), url: `${appUrl}/schedule` })
  }

  // Weekly check-in: on the chosen day, from the chosen time.
  if (wants('checkin') && quiet.length && local.weekday === person.checkin_day && local.time >= person.checkin_time) {
    const names = quiet.slice(0, 3).map((q) => q.company).join(', ')
    const more = quiet.length > 3 ? ` and ${quiet.length - 3} more` : ''
    items.push({ kind: 'checkin', key: `checkin:${local.date}`, title: `${plural(quiet.length, 'application')} waiting for a check-in`, detail: `${names}${more}. One tap each keeps your board honest.`, url: `${appUrl}/checkins` })
  }

  // New matches: a short digest, Mondays and Thursdays.
  if (wants('matches') && MATCH_DAYS.has(local.weekday) && local.time >= DIGEST_TIME) {
    // Monday covers Friday onwards, Thursday covers Tuesday onwards, so nothing appears twice.
    const since = addDay(local.date, local.weekday === 'Monday' ? -3 : -2)
    const fresh = matches.filter((m) => m.match_date >= since && m.posting && !m.posting.closed_at)
    items.push(
      ...fresh.slice(0, MATCHES_IN_DIGEST).map((m) => ({
        kind: 'matches' as const,
        // One key for the whole digest, so it goes out once on each chosen day.
        key: `matches:${local.date}`,
        title: `${m.posting!.title} at ${m.posting!.company}`,
        detail: m.posting!.location ?? undefined,
        url: `${appUrl}/jobs/${m.posting!.id}`,
      })),
    )
  }

  // Milestones, on the day they're reached, and the monthly recap on the 1st.
  if (wants('recap')) {
    const streak = streakLength(activeDays, local.date)
    if (STREAK_MILESTONES.has(streak))
      items.push({ kind: 'recap', key: `streak:${local.date}:${streak}`, title: `${streak}-day streak`, detail: `You've touched your search every day for ${streak} days.`, url: `${appUrl}/goals` })
    if (recap && local.dayOfMonth === 1 && local.time >= DIGEST_TIME && (recap.applied || recap.responses || recap.interviews))
      items.push({
        kind: 'recap',
        key: `recap:${recap.month}`,
        title: `Your ${recap.label} recap`,
        detail: `${plural(recap.applied, 'application')}, ${plural(recap.responses, 'response')}, ${plural(recap.interviews, 'interview')}.`,
        url: `${appUrl}/goals`,
      })
  }

  // Quiet hours hold everything but interview reminders; they go out after quiet hours end.
  return person.quiet_hours && inQuietHours(local.time, person.quiet_from, person.quiet_to) ? items.filter((i) => i.kind === 'interview') : items
}
