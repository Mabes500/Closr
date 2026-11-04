// Matching (roadmap 6.2c). Runs after enrich.ts, every time the feed runs.
//
//   node scripts/jobs/match.ts                 new matches for everyone with target roles
//   DRY_RUN=true node scripts/jobs/match.ts    count what would be matched, write nothing
//
// For each person: open postings first seen in the last 14 days, minus jobs already on
// their board and anything matched before (saved or dismissed), scored by matching.ts.
// The best are saved to job_matches for today (in their time zone), up to 15 a day across
// all of the day's runs, so new jobs and new profiles don't wait until tomorrow.
// Logs show counts only, never names, emails or companies.

import { appendFileSync } from 'node:fs'
import { all, chunks, connect } from './db.ts'
import { FRESH_DAYS, MAX_PER_DAY, prepare, topMatches, type MatchPosting, type MatchProfile } from './matching.ts'

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')

type Person = MatchProfile & { id: string; time_zone: string | null }

const dayIn = (tz: string | null) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz ?? 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

// "https://Jobs.Lever.co/acme/123/?utm=x#top" → "jobs.lever.co/acme/123"
const urlKey = (u: string | null) => {
  if (!u) return null
  try {
    const url = new URL(u.trim())
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}
const jobKey = (company: string, title: string) => `${company.trim().toLowerCase()}|${title.trim().toLowerCase()}`

function byUser<T extends { user_id: string }>(rows: T[]) {
  const out = new Map<string, T[]>()
  for (const r of rows) {
    const list = out.get(r.user_id)
    if (list) list.push(r)
    else out.set(r.user_id, [r])
  }
  return out
}

async function main() {
  const db = connect()
  const started = Date.now()

  const people = (
    await all<Person>((a, b) =>
      db
        .from('profiles')
        .select('id, target_roles, work_setups, locations, work_countries, needs_visa_sponsorship, salary_floor, salary_floor_currency, time_zone')
        .order('id')
        .range(a, b),
    )
  ).filter((p) => p.target_roles?.length)

  const since = new Date(Date.now() - FRESH_DAYS * 86_400_000).toISOString()
  const postings = await all<MatchPosting & { company: string; apply_url: string }>((a, b) =>
    db
      .from('job_postings')
      .select(
        'id, company, title, location, countries, work_mode, salary_min, salary_max, salary_currency, salary_period, first_seen_at, posted_at, role_category, role_title, visa_sponsorship, remote_regions, remote_countries, apply_url',
      )
      .is('closed_at', null)
      .gte('first_seen_at', since)
      .order('id')
      .range(a, b),
  )
  const apps = await all<{ user_id: string; company: string; role: string; job_url: string | null }>((a, b) =>
    db.from('applications').select('user_id, company, role, job_url').order('id').range(a, b),
  )
  const matched = await all<{ user_id: string; posting_id: string; match_date: string }>((a, b) =>
    // A day of margin for time zones; the postings below are no older than the fresh window.
    db.from('job_matches').select('user_id, posting_id, match_date').gte('match_date', new Date(Date.now() - (FRESH_DAYS + 1) * 86_400_000).toISOString().slice(0, 10)).order('id').range(a, b),
  )
  const appsOf = byUser(apps)
  const matchesOf = byUser(matched)
  console.log(`${DRY_RUN ? '[dry run] ' : ''}Matching ${postings.length} fresh postings for ${people.length} people with target roles…`)

  // Postings by link and by company + title, to spot jobs already on someone's board.
  const byUrl = new Map<string, string[]>()
  const byJob = new Map<string, string[]>()
  for (const p of postings) {
    const u = urlKey(p.apply_url)
    if (u) byUrl.set(u, [...(byUrl.get(u) ?? []), p.id])
    const k = jobKey(p.company, p.title)
    byJob.set(k, [...(byJob.get(k) ?? []), p.id])
  }

  const totals = { people: people.length, matched: 0, skippedToday: 0, none: 0, rows: 0 }
  const rows: Record<string, unknown>[] = []
  for (const person of people) {
    const today = dayIn(person.time_zone)
    const mine = matchesOf.get(person.id) ?? []
    const room = MAX_PER_DAY - mine.filter((m) => m.match_date === today).length
    if (room <= 0) {
      totals.skippedToday++
      continue
    }
    const skip = new Set(mine.map((m) => m.posting_id))
    for (const a of appsOf.get(person.id) ?? []) {
      for (const id of byUrl.get(urlKey(a.job_url) ?? '') ?? []) skip.add(id)
      for (const id of byJob.get(jobKey(a.company, a.role)) ?? []) skip.add(id)
    }
    const top = topMatches(postings, prepare(person), skip, room)
    if (!top.length) totals.none++
    else totals.matched++
    totals.rows += top.length
    console.log(`  ${person.id.slice(0, 8)}…: ${top.length} match(es)`)
    for (const m of top) rows.push({ user_id: person.id, posting_id: m.posting.id, score: m.score, reasons: m.reasons, match_date: today })
  }

  if (!DRY_RUN)
    for (const part of chunks(rows, 500)) {
      const { error } = await db.from('job_matches').upsert(part, { onConflict: 'user_id,posting_id', ignoreDuplicates: true })
      if (error) throw new Error(`database: ${error.message}`)
    }

  const minutes = ((Date.now() - started) / 60_000).toFixed(1)
  console.log(
    `Done in ${minutes} min${DRY_RUN ? ' (dry run: nothing written)' : ''}: ${totals.rows} matches for ${totals.matched} people; ` +
      `${totals.none} with nothing new; ${totals.skippedToday} already at today's limit.`,
  )
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        `### Matching${DRY_RUN ? ' (dry run)' : ''}`,
        '',
        '| people with target roles | got matches | nothing new | at today\'s limit | matches saved |',
        '|---:|---:|---:|---:|---:|',
        `| ${totals.people} | ${totals.matched} | ${totals.none} | ${totals.skippedToday} | ${DRY_RUN ? `(${totals.rows})` : totals.rows} |`,
        '',
      ].join('\n'),
    )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
