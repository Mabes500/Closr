// The daily jobs feed run (roadmap 6.2a, docs/JOBS-FEED-PLAN.md section 3, steps 1–3).
//
//   node scripts/jobs/run.ts            read every board, save postings
//   DRY_RUN=true node scripts/jobs/run.ts   read and count, write nothing
//   LIMIT=20 node scripts/jobs/run.ts   only the first 20 boards (for a quick test)
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (GitHub secrets in the workflow).
// Enrichment (6.2b) and matching (6.2c) come later.

import { appendFileSync } from 'node:fs'
import { fetchBoard, normalise, type Ats, type Board, type Posting } from './ats.ts'
import { all, chunks, connect, pool, type Db } from './db.ts'

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')
const LIMIT = Number(process.env.LIMIT) || 0
const CONCURRENCY = 4 // boards read at once
const PAUSE_MS = 500 // pause after each board, per worker
const DAY = 86_400_000
const PRUNE_AFTER_DAYS = 14 // zero jobs or errors this long → inactive
const RECHECK_AFTER_DAYS = 7 // inactive boards are tried again weekly

type BoardRow = Board & { active: boolean; last_fetched_at: string | null; unhealthy_since: string | null; consecutive_failures: number }
type Counts = { boards: number; ok: number; empty: number; failed: number; jobs: number; new: number; updated: number; closed: number; deactivated: number; reactivated: number }
const blank = (): Counts => ({ boards: 0, ok: 0, empty: 0, failed: 0, jobs: 0, new: 0, updated: 0, closed: 0, deactivated: 0, reactivated: 0 })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const daysSince = (iso: string | null) => (iso ? (Date.now() - Date.parse(iso)) / DAY : Infinity)

// Inserts new postings, refreshes existing ones (last_seen_at, reopened if they came
// back), and closes this board's postings that are no longer listed.
async function save(db: Db, board: BoardRow, postings: Posting[]) {
  const now = new Date().toISOString()
  const existing = await all<{ id: string; external_id: string; closed_at: string | null }>((a, b) =>
    db.from('job_postings').select('id, external_id, closed_at').eq('board_id', board.id).range(a, b),
  )
  const known = new Set(existing.map((e) => e.external_id))
  const listed = new Set(postings.map((p) => p.external_id))

  // first_seen_at is left out, so it's set once on insert and never overwritten.
  const rows = postings.map((p) => ({ ...p, board_id: board.id, last_seen_at: now, closed_at: null }))
  for (const part of chunks(rows, 200)) {
    const { error } = await db.from('job_postings').upsert(part, { onConflict: 'source,external_id' })
    if (error) throw new Error(`saving postings: ${error.message}`)
  }

  const toClose = existing.filter((e) => !e.closed_at && !listed.has(e.external_id)).map((e) => e.id)
  for (const ids of chunks(toClose, 200)) {
    const { error } = await db.from('job_postings').update({ closed_at: now }).in('id', ids)
    if (error) throw new Error(`closing postings: ${error.message}`)
  }

  const added = postings.filter((p) => !known.has(p.external_id)).length
  return { new: added, updated: postings.length - added, closed: toClose.length }
}

async function main() {
  const db = connect()
  const started = Date.now()
  const rows = await all<BoardRow>((a, b) =>
    db.from('job_boards').select('id, ats, slug, region, company_name, active, last_fetched_at, unhealthy_since, consecutive_failures').order('created_at').range(a, b),
  )
  // Active boards every day; inactive ones once a week, in case they're hiring again.
  let boards = rows.filter((b) => b.active || daysSince(b.last_fetched_at) >= RECHECK_AFTER_DAYS)
  if (LIMIT) boards = boards.slice(0, LIMIT)
  console.log(`${DRY_RUN ? '[dry run] ' : ''}Reading ${boards.length} of ${rows.length} boards (${rows.filter((b) => b.active).length} active)…`)

  const bySource: Record<Ats, Counts> = { greenhouse: blank(), lever: blank(), ashby: blank() }
  const failures: string[] = []
  let dbErrors = 0

  await pool(boards, CONCURRENCY, async (board) => {
    const c = bySource[board.ats]
    c.boards++
    const now = new Date().toISOString()
    let patch: Record<string, unknown>
    try {
      const { raw, region } = await fetchBoard(board)
      const postings = normalise(raw, board)
      c.ok++
      c.jobs += postings.length
      if (!postings.length) c.empty++
      if (!DRY_RUN) {
        const r = await save(db, board, postings)
        c.new += r.new
        c.updated += r.updated
        c.closed += r.closed
      }
      const healthy = postings.length > 0
      const unhealthySince = healthy ? null : (board.unhealthy_since ?? now)
      const active = healthy || daysSince(unhealthySince) < PRUNE_AFTER_DAYS
      patch = {
        region,
        last_fetched_at: now,
        last_job_count: postings.length,
        consecutive_failures: 0,
        last_error: null,
        unhealthy_since: unhealthySince,
        active,
        // Greenhouse says the company's name; keep it for the other ATSs' fallbacks too.
        ...(!board.company_name && board.ats === 'greenhouse' && postings[0] ? { company_name: postings[0].company } : {}),
      }
    } catch (e) {
      const message = (e as Error).message
      if (/^(saving|closing|database)/.test(message)) dbErrors++
      c.failed++
      failures.push(`${board.ats}/${board.slug}: ${message}`)
      const unhealthySince = board.unhealthy_since ?? now
      patch = {
        last_fetched_at: now,
        consecutive_failures: board.consecutive_failures + 1,
        last_error: message.slice(0, 500),
        unhealthy_since: unhealthySince,
        active: daysSince(unhealthySince) < PRUNE_AFTER_DAYS,
      }
    }
    if (patch.active === false && board.active) c.deactivated++
    if (patch.active === true && !board.active) c.reactivated++
    if (!DRY_RUN) {
      const { error } = await db.from('job_boards').update(patch).eq('id', board.id)
      if (error) {
        dbErrors++
        failures.push(`${board.ats}/${board.slug}: updating board: ${error.message}`)
      }
    }
    await sleep(PAUSE_MS)
  })

  const minutes = ((Date.now() - started) / 60_000).toFixed(1)
  const total = Object.values(bySource).reduce((t, c) => {
    for (const k of Object.keys(t) as (keyof Counts)[]) t[k] += c[k]
    return t
  }, blank())
  console.log(`\nDone in ${minutes} min${DRY_RUN ? ' (dry run: nothing written)' : ''}.`)
  console.table({ ...bySource, total })
  if (failures.length) {
    console.log(`\n${failures.length} board(s) failed:`)
    for (const f of failures) console.log(`  ✗ ${f}`)
  }

  // A table on the run's page in GitHub Actions.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const cols: (keyof Counts)[] = ['boards', 'ok', 'empty', 'failed', 'jobs', 'new', 'updated', 'closed', 'deactivated', 'reactivated']
    const line = (name: string, c: Counts) => `| ${name} | ${cols.map((k) => c[k]).join(' | ')} |`
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        `### Jobs feed${DRY_RUN ? ' (dry run)' : ''}: ${total.jobs} postings from ${total.ok} boards in ${minutes} min`,
        '',
        `| source | ${cols.join(' | ')} |`,
        `|---|${cols.map(() => '---:').join('|')}|`,
        ...Object.entries(bySource).map(([k, c]) => line(k, c)),
        line('**total**', total),
        '',
      ].join('\n'),
    )
  }

  // Board-level fetch failures are normal (boards move or close); database errors aren't.
  if (dbErrors) {
    console.error(`\n${dbErrors} database error(s); see above.`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
