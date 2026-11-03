// Runs scripts/jobs/enrich.ts against an in-memory stand-in database and a stand-in Claude.
// MODE=dry | MODE=cap | MODE=full (default)
import { mock } from 'node:test'
import { pathToFileURL } from 'node:url'

const ROOT = 'C:/Users/Admin/Documents/GitHub/Closr/closr/scripts/jobs/'
const MODE = process.env.MODE ?? 'full'
const ats = await import(pathToFileURL(ROOT + 'ats.ts').href)
const real = await import(pathToFileURL(ROOT + 'db.ts').href)

// Real postings from two boards.
const postings = []
for (const [a, slug] of [['greenhouse', 'stripe'], ['greenhouse', 'duolingo']]) {
  const { raw, region } = await ats.fetchBoard({ ats: a, slug, region: null })
  for (const p of ats.normalise(raw, { id: '', ats: a, slug, region, company_name: null }).slice(0, 60))
    postings.push({ ...p, id: crypto.randomUUID(), board_id: 'b', first_seen_at: new Date().toISOString(), closed_at: null, enriched_at: null, ai_checked_at: null, remote_regions: [], remote_countries: [] })
}
// One closed posting: never sent to the AI.
postings[5].closed_at = new Date().toISOString()
const tables = { job_postings: postings, profiles: [{ id: 'u1', target_roles: ['Software engineer', 'Product designer'] }] }

function query(t) {
  const f = []
  let inIds = null
  const run = () => {
    let rows = tables[t].filter((r) => f.every((fn) => fn(r)))
    if (inIds) rows = rows.filter((r) => inIds.includes(r.id))
    return rows.map((r) => ({ ...r }))
  }
  const q = {
    is: (k, v) => (f.push((r) => r[k] === v), q),
    not: (k, _op, v) => (f.push((r) => r[k] !== v), q),
    gt: (k, v) => (f.push((r) => r[k] > v), q),
    order: (k) => ((q._order = k), q),
    limit: async (n) => ({ data: run().sort((a, b) => (a[q._order] < b[q._order] ? -1 : 1)).slice(0, n), error: null }),
    range: async (a, b) => ({ data: run().slice(a, b + 1), error: null }),
    in: async (_k, ids) => ((inIds = ids), { data: run(), error: null }),
  }
  return q
}
const fakeDb = {
  from: (t) => ({
    select: () => query(t),
    upsert: async (items) => {
      for (const it of items) {
        const i = tables[t].findIndex((r) => r.id === it.id)
        tables[t][i] = { ...tables[t][i], ...it }
      }
      return { error: null }
    },
  }),
}
mock.module(pathToFileURL(ROOT + 'db.ts').href, { exports: { ...real, connect: () => fakeDb } })

// Stand-in Claude: answers from the title; refuses one posting.
const calls = []
class FakeAnthropic {
  static AuthenticationError = class extends Error {}
  static PermissionDeniedError = class extends Error {}
  messages = {
    create: async (req) => {
      calls.push(req)
      const title = /Title: (.*)/.exec(req.messages[0].content)[1]
      if (calls.length === 3) return { stop_reason: 'refusal', content: [], usage: { input_tokens: 900, output_tokens: 0 } }
      const answer = { category: 'tech', title: 'Software engineer', seniority: 'mid', visa_sponsorship: /Dublin/.test(req.messages[0].content) ? 'yes' : 'not_stated', work_mode: 'hybrid', remote_regions: ['europe', 'mars'], remote_countries: ['gb', 'XYZ'], timezone: '' }
      void title
      return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(answer) }], usage: { input_tokens: 1400, output_tokens: 80 } }
    },
  }
}
mock.module('@anthropic-ai/sdk', { defaultExport: FakeAnthropic })

process.env.ANTHROPIC_API_KEY = 'test'
if (MODE === 'dry') process.env.DRY_RUN = 'true'
if (MODE === 'cap') process.env.ENRICH_COST_CAP_USD = '0.002'
const exit = process.exit
process.exit = (c) => console.log('process.exit', c)
await import(pathToFileURL(ROOT + 'enrich.ts').href)
for (let i = 0; i < 100 && !globalThis.__done; i++) await new Promise((r) => setTimeout(r, 200))

const P = tables.job_postings
const check = (l, ok, d = '') => console.log(`${ok ? 'PASS' : 'FAIL'}  ${l} ${d}`)
if (MODE === 'dry') {
  check('dry run: no AI calls', calls.length === 0)
  check('dry run: nothing written', P.every((p) => !p.enriched_at))
} else {
  check('rules ran on every posting', P.every((p) => p.enriched_at))
  check('closed posting never sent to the AI', !calls.some((c) => c.messages[0].content.includes(`Title: ${P[5].title}\n`)) || P.filter((p) => p.title === P[5].title).length > 1)
  const first = calls[0]
  check('request: Haiku 5.5, thinking off, low effort, JSON schema', first?.model === 'claude-haiku-5-5' && first.thinking.type === 'disabled' && first.output_config.effort === 'low' && first.output_config.format.type === 'json_schema')
  check('description truncated to 6,000 chars', calls.every((c) => c.messages[0].content.length < 6_400))
  const ai = P.filter((p) => p.enrichment_source === 'ai')
  check('AI answers saved', ai.length > 0, `(${ai.length})`)
  check('invalid region and country codes dropped', ai.every((p) => !p.remote_regions.includes('mars') && p.remote_countries.every((c) => /^[A-Z]{2}$/.test(c))))
  const ruled = ai.find((p) => p.title.toLowerCase().includes('senior'))
  check('rules kept where they had an answer (seniority from title)', !ruled || ruled.seniority === 'senior', ruled?.title)
  check('refused posting marked checked, not filled', P.filter((p) => p.ai_checked_at && p.enrichment_source === 'rules' && p.seniority === null).length >= 1)
  if (MODE === 'cap') check('cost cap stops the AI early', calls.length > 0 && calls.length < 10, `(${calls.length} calls)`)
  else check('no cap hit: every eligible posting called', calls.length >= ai.length)
}
process.exit = exit
