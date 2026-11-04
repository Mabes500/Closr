// The hourly email run (roadmap 7.2), via Resend.
//
//   node scripts/email/send.ts                 send what's due
//   DRY_RUN=true node scripts/email/send.ts    count what would go out, send and save nothing
//   ONLY_EMAIL=me@x.com node scripts/email/send.ts   only this account, for testing
//
// Each person gets at most one email per run. An item is claimed in email_log before
// sending, so a crash or overlapping run can't send it twice; a failed send releases the
// claim so the next run retries. Logs show counts only, never addresses or job details.

import { appendFileSync } from 'node:fs'
import { unsubscribeSignature } from '../../api/_lib/unsubscribe.ts'
import { CHECKIN_DAYS, quietSince } from '../../src/lib/checkinRules.ts'
import { all, connect, type Db } from '../jobs/db.ts'
import { clock, itemsDue, type EmailItem, type MatchRow, type Person, type QuietJob, type Recap, type ReminderRow } from './rules.ts'
import { renderEmail, subjectFor } from './template.ts'

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')
const ONLY_EMAIL = process.env.ONLY_EMAIL?.trim().toLowerCase()
const APP_URL = (process.env.APP_URL || 'https://heyclosr.app').replace(/\/+$/, '')
const RESEND_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM
const UNSUBSCRIBE_SECRET = process.env.EMAIL_UNSUBSCRIBE_SECRET
const PAUSE_MS = 600 // stays under Resend's default rate limit
const DAY = 86_400_000

type Job = { id: string; user_id: string; company: string; role: string; status: string; applied_at: string | null; created_at: string; checked_in_at: string | null }
type Event = { application_id: string; user_id: string; to_status: string | null; close_reason: string | null; occurred_at: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const groupBy = <T,>(rows: T[], key: (r: T) => string) => {
  const m = new Map<string, T[]>()
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r])
  return m
}

// Signed-up, confirmed addresses, from Supabase Auth.
async function confirmedEmails(db: Db) {
  const emails = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`database: ${error.message}`)
    for (const u of data.users) if (u.email && u.email_confirmed_at) emails.set(u.id, u.email)
    if (data.users.length < 1000) return emails
  }
}

// Last month's numbers, in the person's time zone; only worked out on the 1st.
export function recapFor(jobs: Job[], events: Event[], today: string): Recap {
  const d = new Date(`${today.slice(0, 7)}-15T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - 1)
  const month = d.toISOString().slice(0, 7)
  const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const inMonth = events.filter((e) => e.occurred_at.startsWith(month))
  const uniqueApps = (es: Event[]) => new Set(es.map((e) => e.application_id)).size
  const interviewed = inMonth.filter((e) => e.to_status === 'interviewing' || e.to_status === 'offer')
  return {
    month,
    label,
    applied: jobs.filter((j) => j.applied_at?.startsWith(month)).length,
    interviews: uniqueApps(interviewed),
    responses: uniqueApps([...interviewed, ...inMonth.filter((e) => e.to_status === 'closed' && e.close_reason === 'rejected')]),
  }
}

// Claims items in email_log; returns the keys this run won.
async function claim(db: Db, userId: string, items: EmailItem[]) {
  const rows = [...new Map(items.map((i) => [i.key, { user_id: userId, kind: i.kind, dedupe_key: i.key }])).values()]
  const { data, error } = await db.from('email_log').upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true }).select('dedupe_key')
  if (error) throw new Error(`database: ${error.message}`)
  return new Set((data as { dedupe_key: string }[]).map((r) => r.dedupe_key))
}

class StopSending extends Error {}

async function sendEmail(to: string, userId: string, items: EmailItem[]) {
  const unsubscribe = `${APP_URL}/api/unsubscribe?u=${userId}&s=${unsubscribeSignature(userId, UNSUBSCRIBE_SECRET!)}`
  const { html, text } = renderEmail(items, { settings: `${APP_URL}/settings`, unsubscribe })
  for (let attempt = 1; ; attempt++) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subjectFor(items),
        html,
        text,
        headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (r.ok) return ((await r.json()) as { id?: string }).id ?? null
    // A bad key or an unverified domain fails for everyone, so stop rather than retry each person.
    if (r.status === 401 || r.status === 403) throw new StopSending(`Resend refused the request (${r.status}). Check RESEND_API_KEY and that the EMAIL_FROM domain is verified.`)
    if (r.status === 429 && attempt < 2) {
      await sleep((Number(r.headers.get('retry-after')) || 2) * 1000)
      continue
    }
    throw new Error(`Resend answered ${r.status}`)
  }
}

async function main() {
  if (!DRY_RUN && (!RESEND_KEY || !EMAIL_FROM || !UNSUBSCRIBE_SECRET)) {
    // Not set up yet: stay green rather than fail every hour.
    console.log('Email isn’t set up yet (RESEND_API_KEY, EMAIL_FROM, EMAIL_UNSUBSCRIBE_SECRET). Nothing sent.')
    return
  }
  const db = connect()
  const now = new Date()

  const emails = await confirmedEmails(db)
  const people = (
    await all<Person>((a, b) =>
      db.from('profiles').select('id, time_zone, notification_prefs, quiet_hours, quiet_from, quiet_to, checkin_day, checkin_time').order('id').range(a, b),
    )
  ).filter((p) => {
    const email = emails.get(p.id)
    return email && (!ONLY_EMAIL || email.toLowerCase() === ONLY_EMAIL) && Object.values(p.notification_prefs ?? {}).some((c) => c?.email)
  })

  const reminders = groupBy(
    await all<ReminderRow & { user_id: string }>((a, b) =>
      db.from('reminders').select('id, user_id, type, title, due_at, snoozed_until, application_id, application:applications(company, role)').eq('done', false).order('id').range(a, b) as never,
    ),
    (r) => r.user_id,
  )
  const jobs = groupBy(
    await all<Job>((a, b) => db.from('applications').select('id, user_id, company, role, status, applied_at, created_at, checked_in_at').order('id').range(a, b)),
    (j) => j.user_id,
  )
  const events = groupBy(
    await all<Event>((a, b) => db.from('application_events').select('application_id, user_id, to_status, close_reason, occurred_at').order('id').range(a, b)),
    (e) => e.user_id,
  )
  const recent = new Date(now.getTime() - 5 * DAY).toISOString().slice(0, 10)
  const matches = groupBy(
    await all<MatchRow & { user_id: string }>((a, b) =>
      db.from('job_matches').select('id, user_id, match_date, posting:job_postings(id, title, company, location, closed_at)').eq('status', 'new').gte('match_date', recent).order('score', { ascending: false }).order('id').range(a, b) as never,
    ),
    (m) => m.user_id,
  )
  const activity = groupBy(
    await all<{ user_id: string; day: string }>((a, b) =>
      db.from('activity_days').select('user_id, day').gte('day', new Date(now.getTime() - 400 * DAY).toISOString().slice(0, 10)).order('user_id').order('day').range(a, b),
    ),
    (d) => d.user_id,
  )
  const logged = new Map<string, Set<string>>()
  const log = await all<{ user_id: string; dedupe_key: string }>((a, b) =>
    db.from('email_log').select('user_id, dedupe_key').gte('sent_at', new Date(now.getTime() - 60 * DAY).toISOString()).order('id').range(a, b),
  )
  for (const l of log) logged.set(l.user_id, (logged.get(l.user_id) ?? new Set()).add(l.dedupe_key))

  const totals = { people: people.length, due: 0, sent: 0, items: 0, failed: 0 }
  const byKind: Record<string, number> = {}
  let stopped = ''

  for (const person of people) {
    const mine = jobs.get(person.id) ?? []
    const myEvents = events.get(person.id) ?? []
    const lastEvent = new Map<string, string>()
    for (const e of myEvents) if (!lastEvent.has(e.application_id) || e.occurred_at > lastEvent.get(e.application_id)!) lastEvent.set(e.application_id, e.occurred_at)
    const quiet: QuietJob[] = mine
      .filter((j) => j.status === 'applied' && now.getTime() - new Date(quietSince(j, lastEvent.get(j.id))).getTime() >= CHECKIN_DAYS * DAY)
      .map((j) => ({ id: j.id, company: j.company, role: j.role, days: Math.floor((now.getTime() - new Date(j.applied_at ?? j.created_at).getTime()) / DAY) }))
    const local = clock(person.time_zone, now)
    const sent = logged.get(person.id)
    const items = itemsDue({
      person,
      reminders: reminders.get(person.id) ?? [],
      quiet,
      matches: matches.get(person.id) ?? [],
      activeDays: new Set((activity.get(person.id) ?? []).map((d) => d.day)),
      recap: local.dayOfMonth === 1 ? recapFor(mine, myEvents, local.date) : null,
      appUrl: APP_URL,
      now,
    }).filter((i) => !sent?.has(i.key))
    if (!items.length) continue
    totals.due++
    for (const i of items) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1
    if (DRY_RUN) continue

    const won = await claim(db, person.id, items)
    const toSend = items.filter((i) => won.has(i.key))
    if (!toSend.length) continue
    try {
      const id = await sendEmail(emails.get(person.id)!, person.id, toSend)
      totals.sent++
      totals.items += toSend.length
      if (id) await db.from('email_log').update({ resend_id: id }).eq('user_id', person.id).in('dedupe_key', [...won])
    } catch (e) {
      // Not sent, so release the claim and let the next run try again.
      await db.from('email_log').delete().eq('user_id', person.id).in('dedupe_key', [...won])
      if (e instanceof StopSending) {
        stopped = e.message
        break
      }
      totals.failed++
      console.log(`  ✗ ${person.id.slice(0, 8)}…: ${(e as Error).message}`)
    }
    await sleep(PAUSE_MS)
  }

  const kinds = Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'
  const line = DRY_RUN
    ? `[dry run] ${totals.due} of ${totals.people} people have something due (${kinds}). Nothing sent or saved.`
    : `${totals.sent} email(s) sent to ${totals.people} eligible people, ${totals.items} item(s) (${kinds}); ${totals.failed} failed.`
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Email notifications\n\n${line}\n`)
  if (stopped) {
    console.error(stopped)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
