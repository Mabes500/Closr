// Reading Greenhouse, Lever and Ashby public job boards, and mapping each to one
// job_postings shape (docs/JOBS-FEED-PLAN.md, sections 1 and 3). No database here.

import { decodeEntities, prettify, stripHtml, workModeFrom, type WorkMode } from '../../api/_lib/extract.ts'
import { COUNTRY_BY_NAME } from '../../src/lib/countries.ts'

export type Ats = 'greenhouse' | 'lever' | 'ashby'
export type SalaryPeriod = 'year' | 'month' | 'week' | 'day' | 'hour'

export interface Board {
  id: string
  ats: Ats
  slug: string
  region: 'eu' | null
  company_name: string | null
}

// One row of job_postings, minus the columns the database fills in.
export interface Posting {
  source: Ats
  external_id: string
  company: string
  title: string
  location: string | null
  countries: string[]
  work_mode: WorkMode | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: SalaryPeriod | null
  description: string | null
  apply_url: string
  posted_at: string | null
}

type Json = Record<string, unknown>

// ---------------------------------------------------------------------------
// Fetching: an honest user agent, a timeout, one retry, then give up.
// ---------------------------------------------------------------------------
const repo = process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : 'Closr job search tracker'
export const USER_AGENT = `ClosrJobsFeed/1.0 (reads public job board APIs once a day; ${process.env.FEED_CONTACT ?? repo})`

export class FetchFailed extends Error {
  status: number | null
  constructor(message: string, status: number | null) {
    super(message)
    this.status = status
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getJson(url: string): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) })
      if (r.ok) return await r.json()
      // 404 means the board doesn't exist (or moved); retrying won't help.
      if (r.status === 404 || attempt >= 2) throw new FetchFailed(`HTTP ${r.status}`, r.status)
      await sleep(r.status === 429 ? 15_000 : 3_000)
    } catch (e) {
      if (e instanceof FetchFailed || attempt >= 2) throw e instanceof FetchFailed ? e : new FetchFailed((e as Error).message, null)
      await sleep(3_000)
    }
  }
}

export function boardUrl(ats: Ats, slug: string, region: 'eu' | null): string {
  const s = encodeURIComponent(slug)
  if (ats === 'greenhouse') return `https://boards-api${region === 'eu' ? '.eu' : ''}.greenhouse.io/v1/boards/${s}/jobs?content=true`
  if (ats === 'lever') return `https://api${region === 'eu' ? '.eu' : ''}.lever.co/v0/postings/${s}?mode=json`
  return `https://api.ashbyhq.com/posting-api/job-board/${s}?includeCompensation=true`
}

// Reads a whole board. Greenhouse and Lever boards that live on the EU host answer
// 404 on the global one, so on a 404 the EU host is tried too; `region` says which worked.
export async function fetchBoard(board: Pick<Board, 'ats' | 'slug' | 'region'>): Promise<{ raw: unknown; region: 'eu' | null }> {
  try {
    return { raw: await getJson(boardUrl(board.ats, board.slug, board.region)), region: board.region }
  } catch (e) {
    const otherRegion = board.region === 'eu' ? null : 'eu'
    if (!(e instanceof FetchFailed) || e.status !== 404 || board.ats === 'ashby') throw e
    try {
      return { raw: await getJson(boardUrl(board.ats, board.slug, otherRegion)), region: otherRegion }
    } catch {
      // Not on the other host either: report the original "not found".
      throw new FetchFailed('HTTP 404 (board not found)', 404)
    }
  }
}

// ---------------------------------------------------------------------------
// Normalising
// ---------------------------------------------------------------------------
const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = decodeEntities(v).replace(/\s+/g, ' ').trim()
  return t || null
}
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : v
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}
const currency = (v: unknown) => (typeof v === 'string' && /^[A-Za-z]{3}$/.test(v.trim()) ? v.trim().toUpperCase() : null)
const isoDate = (v: unknown): string | null => {
  if (v == null || v === '') return null
  const d = new Date(typeof v === 'number' ? v : String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const MAX_DESCRIPTION = 20_000
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
// Phone-like runs: optional +country code and (area code), then 2+ groups of digits.
// Only removed when they hold 9 to 15 digits, so dates ("2026-01-15") and salaries stay.
const PHONE = /(?<![\w+])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}(?:[\s.-]\d{2,4}){1,4}(?![\w])/g

// Plain text, without emails or phone numbers (plan section 3), capped in length.
export function cleanDescription(text: string | null): string | null {
  if (!text) return null
  const t = text
    .replace(EMAIL, '')
    .replace(PHONE, (m) => {
      const digits = m.replace(/\D/g, '').length
      return digits >= 9 && digits <= 15 ? '' : m
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return t ? t.slice(0, MAX_DESCRIPTION) : null
}

// Country names (and common short forms) → ISO 3166 codes (shared with the app).
const COUNTRY = COUNTRY_BY_NAME
// "San Francisco, CA" / "Toronto, ON": a trailing state or province code.
const US_STATES = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '))
const CA_PROVINCES = new Set('AB BC MB NB NL NS NT NU ON PE QC SK YT'.split(' '))

export function countriesIn(...texts: (string | null | undefined)[]): string[] {
  const found = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    for (const raw of text.split(/[,;/|()·•\n]|\s[-–—]\s|\bor\b|\band\b/i)) {
      const part = raw.trim()
      if (!part) continue
      const code = COUNTRY.get(part.toLowerCase().replace(/^remote\s*[-–:]?\s*/, '').trim())
      if (code) found.add(code)
      else if (/^[A-Z]{2}$/.test(part) && US_STATES.has(part) && /,\s*[A-Z]{2}\b/.test(text)) found.add('US')
      else if (/^[A-Z]{2}$/.test(part) && CA_PROVINCES.has(part) && /,\s*[A-Z]{2}\b/.test(text)) found.add('CA')
    }
  }
  return [...found].sort()
}

const LEVER_MODE: Record<string, WorkMode> = { remote: 'remote', hybrid: 'hybrid', 'on-site': 'onsite', onsite: 'onsite' }
const ASHBY_MODE: Record<string, WorkMode> = { remote: 'remote', hybrid: 'hybrid', onsite: 'onsite', 'on-site': 'onsite' }

function period(raw: unknown): SalaryPeriod | null {
  const t = String(raw ?? '').toLowerCase()
  if (/hour/.test(t)) return 'hour'
  if (/day|daily/.test(t)) return 'day'
  if (/week/.test(t)) return 'week'
  if (/month/.test(t)) return 'month'
  if (/year|annual|salary/.test(t)) return 'year'
  return null
}

// Keep a range only when it has a currency and at least one amount; order min ≤ max.
function salary(min: unknown, max: unknown, cur: unknown, per: SalaryPeriod | null) {
  let lo = num(min)
  let hi = num(max)
  const c = currency(cur)
  if ((!lo && !hi) || !c || !per) return { salary_min: null, salary_max: null, salary_currency: null, salary_period: null }
  if (lo && hi && hi < lo) [lo, hi] = [hi, lo]
  return { salary_min: lo, salary_max: hi, salary_currency: c, salary_period: per }
}

function greenhouse(raw: unknown, board: Board): Posting[] {
  const jobs = ((raw as Json)?.jobs ?? []) as Json[]
  return jobs.flatMap((j) => {
    const title = str(j.title)
    const url = str(j.absolute_url)
    if (!title || !url || j.id == null) return []
    const location = str((j.location as Json | undefined)?.name)
    const offices = ((j.offices ?? []) as Json[]).map((o) => str(o.location) ?? str(o.name))
    const description = typeof j.content === 'string' ? stripHtml(decodeEntities(j.content)) : null
    return [
      {
        source: 'greenhouse' as const,
        external_id: String(j.id),
        company: str(j.company_name) ?? board.company_name ?? prettify(board.slug),
        title,
        location,
        countries: countriesIn(location, ...offices),
        work_mode: workModeFrom(title, location ?? undefined) ?? null,
        // The list endpoint doesn't include pay ranges.
        ...salary(null, null, null, null),
        description: cleanDescription(description),
        apply_url: url,
        posted_at: isoDate(j.first_published ?? j.updated_at),
      },
    ]
  })
}

function lever(raw: unknown, board: Board): Posting[] {
  const jobs = (Array.isArray(raw) ? raw : []) as Json[]
  return jobs.flatMap((j) => {
    const title = str(j.text)
    const url = str(j.hostedUrl) ?? str(j.applyUrl)
    if (!title || !url || !j.id) return []
    const cat = (j.categories ?? {}) as Json
    const location = str(cat.location)
    const all = Array.isArray(cat.allLocations) ? (cat.allLocations as unknown[]).map(str) : []
    const lists = ((j.lists ?? []) as Json[]).map((l) => `${str(l.text) ?? ''}\n${typeof l.content === 'string' ? stripHtml(l.content) : ''}`)
    const plain = (v: unknown) => (typeof v === 'string' && v.trim() ? decodeEntities(v) : null)
    const description = [plain(j.descriptionPlain) ?? (typeof j.description === 'string' ? stripHtml(j.description) : null), ...lists, plain(j.additionalPlain)]
      .filter(Boolean)
      .join('\n\n')
    const range = j.salaryRange as Json | undefined
    const country = typeof j.country === 'string' && /^[A-Z]{2}$/i.test(j.country) ? [j.country.toUpperCase()] : []
    return [
      {
        source: 'lever' as const,
        external_id: String(j.id),
        company: board.company_name ?? prettify(board.slug),
        title,
        location,
        countries: [...new Set([...country, ...countriesIn(location, ...all)])].sort(),
        work_mode: LEVER_MODE[String(j.workplaceType ?? '').toLowerCase()] ?? workModeFrom(title, location ?? undefined) ?? null,
        ...salary(range?.min, range?.max, range?.currency, range ? period(range.interval) : null),
        description: cleanDescription(description),
        apply_url: url,
        posted_at: isoDate(j.createdAt),
      },
    ]
  })
}

function ashby(raw: unknown, board: Board): Posting[] {
  const jobs = ((raw as Json)?.jobs ?? []) as Json[]
  return jobs.flatMap((j) => {
    // Unlisted jobs are hidden from the employer's own page: skip them (plan section 1).
    if (j.isListed === false) return []
    const title = str(j.title)
    const url = str(j.jobUrl) ?? str(j.applyUrl)
    if (!title || !url || !j.id) return []
    const location = str(j.location)
    const secondary = ((j.secondaryLocations ?? []) as Json[])
    const addressCountry = (a: unknown) => str(((a as Json | undefined)?.postalAddress as Json | undefined)?.addressCountry)
    const comp = (((j.compensation as Json | undefined)?.summaryComponents ?? []) as Json[]).find(
      (c) => String(c.compensationType).toLowerCase() === 'salary',
    )
    const mode = ASHBY_MODE[String(j.workplaceType ?? '').toLowerCase()] ?? (j.isRemote ? 'remote' : workModeFrom(title, location ?? undefined))
    return [
      {
        source: 'ashby' as const,
        external_id: String(j.id),
        company: board.company_name ?? prettify(board.slug),
        title,
        location: [location, ...secondary.map((s) => str(s.location))].filter(Boolean).join('; ') || null,
        countries: countriesIn(location, addressCountry(j.address), ...secondary.flatMap((s) => [str(s.location), addressCountry(s.address)])),
        work_mode: mode ?? null,
        ...salary(comp?.minValue, comp?.maxValue, comp?.currencyCode, comp ? period(comp.interval) : null),
        description: cleanDescription(str(j.descriptionPlain) ? String(j.descriptionPlain) : typeof j.descriptionHtml === 'string' ? stripHtml(j.descriptionHtml) : null),
        apply_url: url,
        posted_at: isoDate(j.publishedAt),
      },
    ]
  })
}

// One board's response → postings (duplicates by id dropped).
export function normalise(raw: unknown, board: Board): Posting[] {
  const list = board.ats === 'greenhouse' ? greenhouse(raw, board) : board.ats === 'lever' ? lever(raw, board) : ashby(raw, board)
  const seen = new Set<string>()
  return list.filter((p) => !seen.has(p.external_id) && seen.add(p.external_id))
}
