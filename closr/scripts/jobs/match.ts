// Daily matching (roadmap 6.2c). Runs after enrich.ts.
//
//   node scripts/jobs/match.ts                 today's matches for everyone with target roles
//   DRY_RUN=true node scripts/jobs/match.ts    count what would be matched, write nothing
//
// For each person: open postings first seen in the last 14 days, minus jobs already on
// their board and anything matched before (saved or dismissed), scored by matching.ts;
// the best 15 are saved to job_matches for today (in their time zone). A person already
// matched today is skipped, so re-running the workflow doesn't double up.
// Logs show counts only, never names, emails or companies.

import { appendFileSync } from 'node:fs'
import { all, chunks, connect } from './db.ts'
import { FRESH_DAYS, prepare, topMatches, type MatchPosting, type MatchProfile } from './matching.ts'

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
    db.from('job_matches').select('user_id, posting_id, match_date').order('id').range(a, b),
  )
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
    const mine = matched.filter((m) => m.user_id === person.id)
    if (mine.some((m) => m.match_date === today)) {
      totals.skippedToday++
      continue
    }
    const skip = new Set(mine.map((m) => m.posting_id))
    for (const a of apps) {
      if (a.user_id !== person.id) continue
      for (const id of byUrl.get(urlKey(a.job_url) ?? '') ?? []) skip.add(id)
      for (const id of byJob.get(jobKey(a.company, a.role)) ?? []) skip.add(id)
    }
    const top = topMatches(postings, prepare(person), skip)
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
      `${totals.none} with none today; ${totals.skippedToday} already matched today.`,
  )
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        `### Matching${DRY_RUN ? ' (dry run)' : ''}`,
        '',
        '| people with target roles | got matches | none today | already matched today | matches saved |',
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
