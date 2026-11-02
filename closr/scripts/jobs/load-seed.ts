// Loads the starter list of boards (docs/JOBS-FEED-PLAN.md section 2, step 1).
//
//   node scripts/jobs/load-seed.ts           check each board in seed-boards.csv that
//                                            isn't in the database yet; add those with
//                                            at least one open job
//   node scripts/jobs/load-seed.ts --check   check only, no database (prints the result)
//   node scripts/jobs/load-seed.ts --check --write-valid
//                                            also rewrite seed-boards.csv with only the
//                                            boards that passed (for curating the list)
//
// seed-boards.csv: one board per line, `ats,slug[,region]` (region "eu" for EU-hosted
// Lever/Greenhouse boards). Lines starting with # are comments.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fetchBoard, normalise, type Ats } from './ats.ts'
import { all, chunks, connect, pool } from './db.ts'

const FILE = fileURLToPath(new URL('./seed-boards.csv', import.meta.url))
const CHECK_ONLY = process.argv.includes('--check')
const WRITE_VALID = process.argv.includes('--write-valid')

type Seed = { ats: Ats; slug: string; region: 'eu' | null }

function readSeed(): Seed[] {
  const seen = new Set<string>()
  return readFileSync(FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .flatMap((l) => {
      const [ats, slug, region] = l.split(',').map((s) => s.trim())
      const key = `${ats}/${slug?.toLowerCase()}`
      if (!['greenhouse', 'lever', 'ashby'].includes(ats) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(slug ?? '') || seen.has(key)) return []
      seen.add(key)
      return [{ ats: ats as Ats, slug, region: region === 'eu' ? ('eu' as const) : null }]
    })
}

async function main() {
  let seeds = readSeed()
  const db = CHECK_ONLY ? null : connect()

  // Skip boards already registered (by the seed or by users).
  if (db) {
    const rows = await all<{ ats: string; slug: string }>((a, b) => db.from('job_boards').select('ats, slug').order('created_at').range(a, b))
    const known = new Set(rows.map((b) => `${b.ats}/${b.slug.toLowerCase()}`))
    seeds = seeds.filter((s) => !known.has(`${s.ats}/${s.slug.toLowerCase()}`))
  }
  console.log(`Checking ${seeds.length} board(s) from seed-boards.csv…`)

  const valid: (Seed & { jobs: number; company: string | null })[] = []
  const rejected: string[] = []
  await pool(seeds, 4, async (s) => {
    try {
      const { raw, region } = await fetchBoard(s)
      const postings = normalise(raw, { id: '', ats: s.ats, slug: s.slug, region, company_name: null })
      if (postings.length) valid.push({ ...s, region, jobs: postings.length, company: s.ats === 'greenhouse' ? postings[0].company : null })
      else rejected.push(`${s.ats}/${s.slug}: no open jobs`)
    } catch (e) {
      rejected.push(`${s.ats}/${s.slug}: ${(e as Error).message}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  })

  const by = (ats: Ats) => valid.filter((v) => v.ats === ats)
  console.log(`\n${valid.length} valid, ${rejected.length} skipped.`)
  console.table({
    greenhouse: { boards: by('greenhouse').length, jobs: by('greenhouse').reduce((n, v) => n + v.jobs, 0) },
    lever: { boards: by('lever').length, jobs: by('lever').reduce((n, v) => n + v.jobs, 0) },
    ashby: { boards: by('ashby').length, jobs: by('ashby').reduce((n, v) => n + v.jobs, 0) },
  })
  if (rejected.length) console.log(`Skipped:\n${rejected.map((r) => `  - ${r}`).join('\n')}`)

  if (db && valid.length) {
    for (const part of chunks(valid, 200)) {
      const rows = part.map((v) => ({ ats: v.ats, slug: v.slug, region: v.region, company_name: v.company, added_via: 'seed', last_job_count: v.jobs }))
      const { error } = await db.from('job_boards').insert(rows)
      if (error) throw new Error(`adding boards: ${error.message}`)
    }
    console.log(`Added ${valid.length} board(s) to job_boards.`)
  }

  if (WRITE_VALID) {
    const header = readFileSync(FILE, 'utf8').split(/\r?\n/).filter((l) => l.startsWith('#'))
    const lines = valid
      .sort((a, b) => a.ats.localeCompare(b.ats) || a.slug.localeCompare(b.slug))
      .map((v) => [v.ats, v.slug, v.region ?? ''].join(',').replace(/,$/, ''))
    writeFileSync(FILE, [...header, ...lines, ''].join('\n'))
    console.log(`Rewrote seed-boards.csv with the ${lines.length} valid board(s).`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
