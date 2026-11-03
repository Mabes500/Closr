// Enrichment (roadmap 6.2b, docs/JOBS-FEED-PLAN.md section 3 step 4). Runs after run.ts.
//
//   node scripts/jobs/enrich.ts                     rules for new postings, then Claude Haiku for gaps
//   DRY_RUN=true node scripts/jobs/enrich.ts        no writes, no AI calls: counts and an estimated cost
//   ENRICH_COST_CAP_USD=0.5 node scripts/jobs/enrich.ts   stop calling the AI after about $0.50
//
// 1. Rules (rules.ts) for every posting not yet enriched: catalogue role, seniority from
//    the title, clear visa statements, remote regions and time zones from the location.
// 2. Claude Haiku reads the description for what's still unknown, only for open postings
//    in role categories someone targets (or whose category is still unknown), newest first,
//    until the per-run cost cap. Needs ANTHROPIC_API_KEY; without it this step is skipped.

import { appendFileSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import { all, chunks, connect, pool, type Db } from './db.ts'
import { CATEGORIES, REGIONS, SENIORITIES, enrichByRules, gaps, matchRole, type Enrichment, type Region, type Seniority, type Visa } from './rules.ts'
import { ROLE_CATEGORY_LABEL, type RoleCategory } from '../../src/data/roles.ts'

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')
const COST_CAP_USD = Number(process.env.ENRICH_COST_CAP_USD) || 1
const MODEL = 'claude-haiku-5-5'
// Claude Haiku 5.5 list prices per token (prompts up to 100K tokens).
const PRICE_IN = 0.1 / 1_000_000
const PRICE_OUT = 0.5 / 1_000_000
const MAX_DESCRIPTION_CHARS = 6_000 // the first ~1,500 tokens hold what's needed
const AI_CONCURRENCY = 4

// Columns every row upsert must include (they're NOT NULL), plus what the passes read.
const BASE = 'id, board_id, source, external_id, company, title, apply_url'
type Row = { id: string; board_id: string; source: string; external_id: string; company: string; title: string; apply_url: string }
type RuleRow = Row & { location: string | null; description: string | null; work_mode: string | null; countries: string[] }

const now = () => new Date().toISOString()

// Reads every row matching `filter`, 1,000 at a time in id order (stable while rows change).
async function byId<T extends { id: string }>(db: Db, cols: string, filter: (q: any) => any): Promise<T[]> {
  const out: T[] = []
  let last = '00000000-0000-0000-0000-000000000000'
  for (;;) {
    const { data, error } = await filter(db.from('job_postings').select(cols)).gt('id', last).order('id').limit(1000)
    if (error) throw new Error(`database: ${error.message}`)
    out.push(...(data as T[]))
    if (!data || data.length < 1000) return out
    last = (data as T[])[data.length - 1].id
  }
}

async function save(db: Db, rows: Record<string, unknown>[]) {
  for (const part of chunks(rows, 500)) {
    const { error } = await db.from('job_postings').upsert(part, { onConflict: 'id' })
    if (error) throw new Error(`database: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// 1. Rules
// ---------------------------------------------------------------------------
async function rulesPass(db: Db) {
  const rows = await byId<RuleRow>(db, `${BASE}, location, description, work_mode, countries`, (q) => q.is('enriched_at', null))
  const at = now()
  let complete = 0
  const updates = rows.map((r) => {
    const e = enrichByRules(r)
    const done = gaps(e, r.work_mode).length === 0
    if (done) complete++
    return {
      id: r.id, board_id: r.board_id, source: r.source, external_id: r.external_id, company: r.company, title: r.title, apply_url: r.apply_url,
      ...e,
      enriched_at: at,
      enrichment_source: 'rules',
      // Nothing left for the AI to fill in.
      ai_checked_at: done ? at : null,
    }
  })
  if (!DRY_RUN) await save(db, updates)
  const withRole = updates.filter((u) => u.role_category).length
  return { postings: rows.length, withRole, complete }
}

// ---------------------------------------------------------------------------
// 2. Claude Haiku
// ---------------------------------------------------------------------------
// Role categories at least one user targets (their target roles, matched to the catalogue).
async function targetedCategories(db: Db) {
  const profiles = await all<{ target_roles: string[] }>((a, b) => db.from('profiles').select('target_roles').order('id').range(a, b))
  const cats = new Set<RoleCategory>()
  for (const p of profiles) for (const t of p.target_roles ?? []) {
    const m = matchRole(t)
    if (m) cats.add(m.category)
  }
  return cats
}

const SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: [...CATEGORIES, 'other'] },
    title: { type: 'string', description: 'The plain job title without level, team or location, e.g. "Backend engineer".' },
    seniority: { type: 'string', enum: [...SENIORITIES, 'unknown'] },
    visa_sponsorship: { type: 'string', enum: ['yes', 'no', 'not_stated'] },
    work_mode: { type: 'string', enum: ['remote', 'hybrid', 'onsite', 'unknown'] },
    remote_regions: { type: 'array', items: { type: 'string', enum: [...REGIONS] } },
    remote_countries: { type: 'array', items: { type: 'string' } },
    timezone: { type: 'string' },
  },
  required: ['category', 'title', 'seniority', 'visa_sponsorship', 'work_mode', 'remote_regions', 'remote_countries', 'timezone'],
  additionalProperties: false,
} as const

const SYSTEM = `You read job postings for a job-search app and return facts as JSON. Use only what the posting says or clearly implies; when it doesn't say, use "unknown", "not_stated", an empty list or an empty string.

category: the field of the job, one of: ${CATEGORIES.map((c) => `${c} (${ROLE_CATEGORY_LABEL[c]})`).join('; ')}; or "other".
title: the plain job title without seniority, team, product area or location.
seniority: from the title first, then years of experience asked for (0-2 years junior, 2-5 mid, 5+ senior). "manager" only for people managers; "director" includes Head of; "executive" is VP and C-level.
visa_sponsorship: "yes" only if it says it sponsors visas or helps with work permits; "no" if it says it can't sponsor or requires existing work authorization without sponsorship; otherwise "not_stated".
work_mode: remote, hybrid or onsite, as the posting states it.
remote_regions: for remote jobs only, the regions it is open to ("worldwide" if anywhere); empty if not remote or not stated.
remote_countries: for remote jobs limited to specific countries, their ISO 3166-1 alpha-2 codes (e.g. "US", "GB"); otherwise empty.
timezone: any time zone requirement in a short form like "UTC-5 to UTC+1" or "US Eastern hours"; otherwise "".`

type AiRow = Row & { location: string | null; description: string | null; work_mode: string | null } & Enrichment

type AiResult = {
  category: RoleCategory | 'other'
  title: string
  seniority: Seniority | 'unknown'
  visa_sponsorship: Visa
  work_mode: 'remote' | 'hybrid' | 'onsite' | 'unknown'
  remote_regions: Region[]
  remote_countries: string[]
  timezone: string
}

const userText = (p: AiRow) =>
  [
    `Title: ${p.title}`,
    `Company: ${p.company}`,
    `Location: ${p.location ?? 'not given'}`,
    `Work mode from the job board: ${p.work_mode ?? 'not given'}`,
    '',
    'Description:',
    (p.description ?? '(none)').slice(0, MAX_DESCRIPTION_CHARS),
  ].join('\n')

// Rough tokens for the cost check before each call (about 3.5 characters per token).
const estimateCost = (p: AiRow) => ((SYSTEM.length + userText(p).length) / 3.5) * PRICE_IN + 150 * PRICE_OUT

// Fills only what the rules left empty; rules win where both have an answer.
function merge(p: AiRow, ai: AiResult) {
  const role = p.role_category ? null : matchRole(ai.title)
  const category = p.role_category ?? (ai.category !== 'other' && CATEGORIES.includes(ai.category) ? ai.category : null)
  const regions = [...new Set([...p.remote_regions, ...ai.remote_regions.filter((r) => (REGIONS as readonly string[]).includes(r))])]
  const countries = p.remote_countries.length ? p.remote_countries : [...new Set(ai.remote_countries.map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))]
  return {
    role_category: category,
    // The catalogue title, only when it agrees with the category.
    role_title: p.role_title ?? (role && role.category === category ? role.title : null),
    seniority: p.seniority ?? (ai.seniority !== 'unknown' && SENIORITIES.includes(ai.seniority) ? ai.seniority : null),
    visa_sponsorship: p.visa_sponsorship ?? ai.visa_sponsorship,
    work_mode: p.work_mode ?? (ai.work_mode !== 'unknown' ? ai.work_mode : null),
    remote_regions: regions,
    remote_countries: countries,
    timezone_note: p.timezone_note ?? (ai.timezone.trim().slice(0, 120) || null),
  }
}

async function aiPass(db: Db) {
  const targeted = await targetedCategories(db)
  // Light read first (no descriptions): which open, unchecked postings qualify.
  const light = await byId<{ id: string; role_category: string | null; first_seen_at: string }>(db, 'id, role_category, first_seen_at', (q) =>
    q.is('ai_checked_at', null).is('closed_at', null).not('enriched_at', 'is', null),
  )
  // Targeted categories first, then unknown ones; newest first within each.
  const queue = light
    .filter((p) => (p.role_category ? targeted.has(p.role_category as RoleCategory) : true))
    .sort((a, b) => Number(!a.role_category) - Number(!b.role_category) || b.first_seen_at.localeCompare(a.first_seen_at))
  const stats = { targetedCategories: [...targeted], waiting: light.length, eligible: queue.length, called: 0, filled: 0, refused: 0, failed: 0, inputTokens: 0, outputTokens: 0, spent: 0, estimated: 0, stoppedAtCap: false, skipped: '' }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key && !DRY_RUN) {
    stats.skipped = 'ANTHROPIC_API_KEY is not set'
    return stats
  }
  const client = key ? new Anthropic() : null
  let halted = ''

  // Descriptions are fetched 100 at a time, only as far as the budget reaches.
  for (const ids of chunks(queue.map((q) => q.id), 100)) {
    if (stats.stoppedAtCap || halted) break
    const { data, error } = await db
      .from('job_postings')
      .select(`${BASE}, location, description, work_mode, role_category, role_title, seniority, visa_sponsorship, remote_regions, remote_countries, timezone_note`)
      .in('id', ids)
    if (error) throw new Error(`database: ${error.message}`)
    const batch = (data as AiRow[]).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))

    if (DRY_RUN) {
      for (const p of batch) {
        const c = estimateCost(p)
        if (stats.estimated + c > COST_CAP_USD) {
          stats.stoppedAtCap = true
          break
        }
        stats.estimated += c
        stats.called++
      }
      continue
    }

    const results: Record<string, unknown>[] = []
    await pool(batch, AI_CONCURRENCY, async (p) => {
      if (halted) return
      // Reserve the estimate before calling, so parallel calls can't overshoot the cap.
      const reserve = estimateCost(p)
      if (stats.spent + stats.estimated + reserve > COST_CAP_USD) {
        stats.stoppedAtCap = true
        return
      }
      stats.estimated += reserve
      try {
        const response = await client!.messages.create({
          model: MODEL,
          max_tokens: 1000,
          // Plain extraction: no thinking, low effort.
          thinking: { type: 'disabled' },
          output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
          system: SYSTEM,
          messages: [{ role: 'user', content: userText(p) }],
        })
        stats.called++
        stats.inputTokens += response.usage.input_tokens
        stats.outputTokens += response.usage.output_tokens
        stats.spent += response.usage.input_tokens * PRICE_IN + response.usage.output_tokens * PRICE_OUT
        const at = now()
        const row = { id: p.id, board_id: p.board_id, source: p.source, external_id: p.external_id, company: p.company, title: p.title, apply_url: p.apply_url }
        if (response.stop_reason === 'refusal') {
          // Declined: don't ask again for this posting.
          stats.refused++
          results.push({ ...row, ai_checked_at: at })
          return
        }
        const text = response.content.find((b) => b.type === 'text')
        if (response.stop_reason === 'max_tokens' || !text || text.type !== 'text') throw new Error(`no complete answer (${response.stop_reason})`)
        const ai = JSON.parse(text.text) as AiResult
        results.push({ ...row, ...merge(p, ai), ai_checked_at: at, enrichment_source: 'ai' })
        stats.filled++
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
          // A bad key or no billing: stop now rather than fail on every posting.
          halted = `${e.constructor.name}: ${e.message}`
          return
        }
        // Anything else (bad JSON, overload after retries): try again next run.
        stats.failed++
        if (stats.failed <= 10) console.log(`  ✗ ${p.company} · ${p.title}: ${(e as Error).message}`)
      } finally {
        stats.estimated -= reserve
      }
    })
    await save(db, results)
  }
  if (halted) stats.skipped = halted
  return stats
}

async function main() {
  const db = connect()
  const started = Date.now()
  console.log(`${DRY_RUN ? '[dry run] ' : ''}Enriching new postings (AI cost cap $${COST_CAP_USD.toFixed(2)})…`)
  const rules = await rulesPass(db)
  console.log(`Rules: ${rules.postings} new posting(s); role found for ${rules.withRole}; ${rules.complete} complete without AI.`)
  const ai = await aiPass(db)
  const minutes = ((Date.now() - started) / 60_000).toFixed(1)
  const cost = DRY_RUN ? `estimated $${ai.estimated.toFixed(3)}` : `$${ai.spent.toFixed(4)}`
  console.log(
    `AI (${MODEL}): ${ai.eligible} eligible of ${ai.waiting} waiting; targeted categories: ${ai.targetedCategories.join(', ') || 'none yet'}.\n` +
      (DRY_RUN ? `Would call it for ${ai.called} posting(s), ${cost}${ai.stoppedAtCap ? ' (cap reached)' : ''}.` : `Called for ${ai.called}: ${ai.filled} filled, ${ai.refused} declined, ${ai.failed} failed; ${ai.inputTokens} in / ${ai.outputTokens} out tokens, ${cost}${ai.stoppedAtCap ? ' (stopped at the cap)' : ''}.`) +
      (ai.skipped ? `\nAI step skipped: ${ai.skipped}` : ''),
  )
  console.log(`Done in ${minutes} min${DRY_RUN ? ' (dry run: nothing written)' : ''}.`)

  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        `### Enrichment${DRY_RUN ? ' (dry run)' : ''}`,
        '',
        '| step | result |',
        '|---|---|',
        `| rules | ${rules.postings} new postings, role found for ${rules.withRole}, ${rules.complete} complete |`,
        `| AI eligible | ${ai.eligible} of ${ai.waiting} waiting (categories: ${ai.targetedCategories.join(', ') || 'none yet'}) |`,
        DRY_RUN ? `| AI (estimate) | ${ai.called} postings, ${cost}${ai.stoppedAtCap ? ', cap reached' : ''} |` : `| AI | ${ai.filled} filled, ${ai.refused} declined, ${ai.failed} failed, ${cost}${ai.stoppedAtCap ? ', stopped at cap' : ''} |`,
        ai.skipped ? `| note | AI skipped: ${ai.skipped} |` : '',
        '',
      ].join('\n'),
    )
  // A bad key or missing billing should show as a failed run.
  if (ai.skipped && ai.skipped !== 'ANTHROPIC_API_KEY is not set') process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
