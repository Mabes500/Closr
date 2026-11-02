// Spreadsheet import (roadmap 2.2): turning someone's job-search sheet into Closr jobs.
// Plain functions, no UI or network, so they can be tested on their own. Reading the
// file itself (papaparse / SheetJS) lives in readSheet.ts.

import type { ApplicationStatus, CloseReason, JobChannel, NewApplication, WorkMode } from './types'

export const MAX_ROWS = 2000

export type Cell = string | number | boolean | null | undefined
export interface Sheet {
  headers: string[]
  rows: Cell[][]
}

// ---------------------------------------------------------------------------
// Fields and column matching
// ---------------------------------------------------------------------------
export const IMPORT_FIELDS = [
  'title',
  'company',
  'job_url',
  'applied_at',
  'status',
  'salary',
  'location',
  'work_mode',
  'source',
  'notes',
] as const
export type ImportField = (typeof IMPORT_FIELDS)[number]

export const FIELD_LABEL: Record<ImportField, string> = {
  title: 'Job title',
  company: 'Company',
  job_url: 'Job link',
  applied_at: 'Applied date',
  status: 'Stage',
  salary: 'Salary',
  location: 'Location',
  work_mode: 'Work mode',
  source: 'Source',
  notes: 'Notes',
}

// Header names people use for each field (compared after normalising: lowercase, no
// punctuation). Exact matches win; then headers that contain one of these.
const SYNONYMS: Record<ImportField, string[]> = {
  title: ['job title', 'title', 'position', 'role', 'job', 'position title', 'job role', 'role title', 'job name', 'vacancy', 'opening', 'job position'],
  company: ['company', 'employer', 'organisation', 'organization', 'company name', 'org', 'business', 'firm', 'hiring company', 'employer name'],
  job_url: ['link', 'url', 'job link', 'job url', 'posting', 'posting url', 'listing', 'job posting', 'application link', 'apply link', 'job ad', 'website'],
  applied_at: ['date applied', 'applied on', 'applied date', 'application date', 'date of application', 'date submitted', 'submitted on', 'date', 'applied', 'when applied', 'sent on'],
  status: ['status', 'stage', 'application status', 'state', 'outcome', 'result', 'progress', 'current status', 'response'],
  salary: ['salary', 'pay', 'compensation', 'salary range', 'comp', 'rate', 'wage', 'salary expectation', 'pay range', 'expected salary'],
  location: ['location', 'city', 'place', 'office', 'country', 'region', 'based in', 'job location'],
  work_mode: ['work mode', 'remote', 'remote hybrid', 'workplace', 'work type', 'arrangement', 'remote onsite', 'remote or onsite', 'work setup', 'on site'],
  source: ['source', 'where found', 'found on', 'found via', 'job board', 'platform', 'via', 'channel', 'site', 'where i found it', 'how found', 'found through', 'referral'],
  notes: ['notes', 'note', 'comments', 'comment', 'details', 'remarks', 'description', 'next steps', 'misc', 'other'],
}

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export type Mapping = (ImportField | null)[] // one entry per column; null = skip

export function autoMatch(sheet: Sheet): Mapping {
  const scores: { col: number; field: ImportField; score: number }[] = []
  sheet.headers.forEach((h, col) => {
    const n = norm(h)
    if (!n) return
    for (const field of IMPORT_FIELDS) {
      let best = 0
      for (const s of SYNONYMS[field]) {
        if (n === s) best = Math.max(best, 100 - SYNONYMS[field].indexOf(s))
        else if (` ${n} `.includes(` ${s} `)) best = Math.max(best, 50 - SYNONYMS[field].indexOf(s))
      }
      // "Applied" / "Date" columns only count as dates if their cells look like dates.
      if (best && field === 'applied_at' && dateShare(sheet, col) < 0.5) best = 0
      if (best) scores.push({ col, field, score: best })
    }
  })
  // Best pairs first; each field and each column used once.
  const mapping: Mapping = sheet.headers.map(() => null)
  const used = new Set<ImportField>()
  for (const s of scores.sort((a, b) => b.score - a.score)) {
    if (used.has(s.field) || mapping[s.col]) continue
    mapping[s.col] = s.field
    used.add(s.field)
  }
  return mapping
}

export const columnOf = (mapping: Mapping, field: ImportField) => mapping.indexOf(field)
export const missingRequired = (mapping: Mapping) => (['title', 'company'] as const).filter((f) => !mapping.includes(f))

// ---------------------------------------------------------------------------
// Status words → stages
// ---------------------------------------------------------------------------
export type StageChoice =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | `closed:${CloseReason}`

export const STAGE_CHOICES: { value: StageChoice; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'closed:rejected', label: 'Closed · Rejected' },
  { value: 'closed:no_response', label: 'Closed · No response' },
  { value: 'closed:withdrew', label: 'Closed · Withdrew' },
  { value: 'closed:declined_offer', label: 'Closed · Declined offer' },
]

// Order matters: more specific phrases are checked first.
const STATUS_RULES: [RegExp, StageChoice][] = [
  [/declin\w* (the )?offer|offer declin|turned down (the )?offer|rejected (the )?offer/, 'closed:declined_offer'],
  [/withdr|pulled out|no longer interested|not interested|cancel|i declined|backed out/, 'closed:withdrew'],
  [/ghost|no (response|reply|answer|news)|never heard|silence|unanswered|no contact|expired|position (filled|closed)|job closed/, 'closed:no_response'],
  [/not applied|to apply|want to apply|wish ?list|bookmark|save|interested|to ?do|planning|draft|research|considering|maybe/, 'saved'],
  [/offer|accepted|hired|signed/, 'offer'],
  [/reject|declin|not selected|unsuccessful|turned down|denied|didn ?t get|lost|dead|no thanks|^no$|^x$|failed|not progressing|not moving forward/, 'closed:rejected'],
  [/interview|screen|phone|\bcall\b|on ?site|\bfinal\b|technical|assessment|take ?home|\btests?\b|\brounds?\b|\bchat\b|\bhr\b|recruiter|panel|case study/, 'interviewing'],
  [/appl|sent|submitted|waiting|pending|in progress|awaiting|done|yes|emailed|reached out/, 'applied'],
]

export function autoStage(word: string): StageChoice {
  const n = norm(word)
  if (!n) return 'saved'
  return STATUS_RULES.find(([re]) => re.test(n))?.[1] ?? 'applied'
}

// The distinct status words in the sheet (case and spacing ignored), most common first.
export function statusWords(sheet: Sheet, col: number): { word: string; key: string; count: number }[] {
  const by = new Map<string, { word: string; key: string; count: number }>()
  for (const row of sheet.rows) {
    const word = String(row[col] ?? '').trim()
    const key = norm(word)
    const e = by.get(key) ?? { word, key, count: 0 }
    e.count++
    by.set(key, e)
  }
  return [...by.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
export type DateOrder = 'dmy' | 'mdy'

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

const pad = (n: number) => String(n).padStart(2, '0')
function ymd(y: number, m: number, d: number): string | null {
  if (y < 100) y += y < 70 ? 2000 : 1900
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || y < 1990 || y > 2100) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

// Excel stores dates as days since 1899-12-30.
export function excelSerialToDate(n: number): string | null {
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null
  const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000)
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

const NUMERIC = /^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/

// Parses a cell to YYYY-MM-DD. `order` decides 03/04/2026 (dmy: 3 April, mdy: 4 March).
export function parseDate(v: Cell, order: DateOrder): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return excelSerialToDate(v)
  let s = String(v).trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ')
  // ISO with a time: 2026-03-04T10:00:00Z
  s = s.replace(/^(\d{4}-\d{2}-\d{2})[t ].*$/, '$1')
  const num = s.match(NUMERIC)
  if (num) {
    const [a, b, c] = num.slice(1).map(Number)
    if (num[1].length === 4) return ymd(a, b, c) // 2026-03-04, 2026/3/4
    return order === 'dmy' ? ymd(c, b, a) : ymd(c, a, b)
  }
  // 4 Mar 2026, 4-Mar-26, March 4 2026, Mar 4 2026, Wed 4 March 2026
  const words = s.replace(/[/.\-]/g, ' ').split(' ').filter((w) => !/^(mon|tue|wed|thu|fri|sat|sun)\w*$/.test(w))
  const mi = words.findIndex((w) => MONTHS[w.slice(0, 4)] || MONTHS[w.slice(0, 3)])
  if (mi >= 0 && words.length >= 3) {
    const m = MONTHS[words[mi].slice(0, 4)] ?? MONTHS[words[mi].slice(0, 3)]
    const nums = words.filter((_, i) => i !== mi).map(Number)
    if (nums.length >= 2 && nums.every(Number.isFinite)) {
      const [x, y] = nums
      return x > 31 ? ymd(x, m, y) : ymd(y, m, x)
    }
  }
  // A date-only cell that came through as a numeric string, e.g. "45720" from CSV exports.
  if (/^\d{5}(\.\d+)?$/.test(s)) return excelSerialToDate(Number(s))
  return null
}

// Day-first or month-first, from the dates that can only be read one way (a part > 12).
export function detectDateOrder(values: Cell[], fallback: DateOrder): { order: DateOrder; ambiguous: boolean; dmy: number; mdy: number } {
  let dmy = 0
  let mdy = 0
  let ambiguous = 0
  for (const v of values) {
    const m = typeof v === 'string' ? v.trim().match(NUMERIC) : null
    if (!m || m[1].length === 4) continue
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a > 12 && b <= 12) dmy++
    else if (b > 12 && a <= 12) mdy++
    else if (a <= 12 && b <= 12 && a !== b) ambiguous++
  }
  const order = dmy > mdy ? 'dmy' : mdy > dmy ? 'mdy' : fallback
  // Worth asking only when some dates could be read both ways.
  return { order, ambiguous: ambiguous > 0, dmy, mdy }
}

export const dateShare = (sheet: Sheet, col: number) => {
  const filled = sheet.rows.map((r) => r[col]).filter((v) => v !== '' && v !== null && v !== undefined)
  if (!filled.length) return 0
  return filled.filter((v) => parseDate(v, 'dmy') || parseDate(v, 'mdy')).length / filled.length
}

// ---------------------------------------------------------------------------
// Salary, source, work mode, link
// ---------------------------------------------------------------------------
const SYMBOLS: [RegExp, string][] = [
  [/ca\$|c\$|cad/i, 'CAD'],
  [/a\$|au\$|aud/i, 'AUD'],
  [/s\$|sgd/i, 'SGD'],
  [/£|gbp/i, 'GBP'],
  [/€|eur/i, 'EUR'],
  [/₹|inr|rs\.?\b/i, 'INR'],
  [/¥|jpy/i, 'JPY'],
  [/chf/i, 'CHF'],
  [/\$|usd/i, 'USD'],
]

// "£80-95k", "$120,000", "80k–100k", "€50.000", "60000 - 70000 EUR", "100K" → yearly amounts.
export function parseSalary(v: Cell): { salary_min: number | null; salary_max: number | null; salary_currency: string | null } {
  const none = { salary_min: null, salary_max: null, salary_currency: null }
  if (typeof v === 'number') return v > 0 ? { salary_min: Math.round(v), salary_max: Math.round(v), salary_currency: null } : none
  const s = String(v ?? '').trim()
  if (!s) return none
  const code = s.match(/\b[A-Z]{3}\b/)?.[0]
  const currency = SYMBOLS.find(([re]) => re.test(s))?.[1] ?? (code && /^[A-Z]{3}$/.test(code) ? code : null)
  const perHour = /\/\s*h(ou)?r|per hour|hourly|p\/h/i.test(s)
  const perMonth = /\/\s*mo(nth)?|per month|monthly|p\/m/i.test(s)
  // Numbers like 120,000 / 50.000 / 85.5k; the "k" after the last number applies to both.
  const parts = [...s.replace(/(\d)[,.](?=\d{3}\b)/g, '$1').matchAll(/(\d+(?:\.\d+)?)\s*(k|m)?/gi)].map((m) => ({
    n: Number(m[1]),
    unit: (m[2] ?? '').toLowerCase(),
  }))
  if (!parts.length) return none
  const lastUnit = parts[parts.length - 1].unit
  const amounts = parts.slice(0, 2).map(({ n, unit }) => {
    const u = unit || lastUnit
    let x = u === 'k' ? n * 1000 : u === 'm' ? n * 1_000_000 : n
    if (perHour) x *= 2080
    else if (perMonth) x *= 12
    return Math.round(x)
  })
  const [lo, hi = lo] = amounts
  if (!lo || lo < 100) return none
  return { salary_min: Math.min(lo, hi), salary_max: Math.max(lo, hi), salary_currency: currency }
}

export function parseChannel(v: Cell): JobChannel | null {
  const n = norm(v)
  if (!n) return null
  if (/linkedin|twitter|\bx\b|tweet|facebook|instagram|threads|reddit/.test(n)) return 'social'
  if (/refer|friend|colleague|former|network|ex /.test(n)) return 'referral'
  if (/recruit|headhunt|agency|inmail|reached out to me/.test(n)) return 'recruiter'
  if (/slack|discord|community|meetup|forum|newsletter/.test(n)) return 'community'
  if (/indeed|glassdoor|board|wellfound|angel|otta|monster|ziprecruiter|dice|seek|reed|totaljobs|stepstone|remotive|weworkremotely|remote ok|builtin|welcome to the jungle/.test(n)) return 'job_board'
  if (/career|company|website|site|direct|greenhouse|lever|ashby|workday/.test(n)) return 'career_page'
  return 'other'
}

export function parseWorkMode(v: Cell, header = ''): WorkMode | null {
  const n = norm(v)
  if (!n) return null
  if (/hybrid/.test(n)) return 'hybrid'
  if (/remote|wfh|home|anywhere/.test(n)) return 'remote'
  if (/on ?site|office|in person/.test(n)) return 'onsite'
  // A "Remote?" column filled with yes/no.
  if (/remote/.test(norm(header))) return /^(y|yes|true|1)$/.test(n) ? 'remote' : /^(n|no|false|0)$/.test(n) ? 'onsite' : null
  return null
}

export function parseUrl(v: Cell): string | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const withScheme = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(s) ? `https://${s}` : null
  if (!withScheme) return null
  try {
    return new URL(withScheme).toString()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Duplicates
// ---------------------------------------------------------------------------
export const jobKey = (company: string, title: string) => `${norm(company)}|${norm(title)}`
export const urlKey = (u: string | null) =>
  u
    ? u
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '')
    : ''

// ---------------------------------------------------------------------------
// Building the rows
// ---------------------------------------------------------------------------
export interface Prepared {
  index: number // row number in the sheet (1 = first data row)
  values: NewApplication & {
    status: ApplicationStatus
    import_id: string
    source_detail: string | null
    close_reason: CloseReason | null
    position: number
  }
  stage: StageChoice
  duplicate: null | 'board' | 'file'
  problem: string | null // why the row can't be imported (missing title/company)
}

export interface ImportOptions {
  mapping: Mapping
  stages: Record<string, StageChoice> // keyed by status word key
  dateOrder: DateOrder
  importId: string
  existing: { company: string; role: string; job_url: string | null }[]
}

const text = (v: Cell) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim()
  return s || null
}

export function prepareRows(sheet: Sheet, o: ImportOptions): Prepared[] {
  const col = (f: ImportField) => columnOf(o.mapping, f)
  const get = (row: Cell[], f: ImportField) => (col(f) >= 0 ? row[col(f)] : undefined)
  const seenJobs = new Set(o.existing.map((e) => jobKey(e.company, e.role)))
  const seenUrls = new Set(o.existing.map((e) => urlKey(e.job_url)).filter(Boolean))
  const fileJobs = new Set<string>()
  const fileUrls = new Set<string>()
  const now = Date.now() / 1000

  return sheet.rows.map((row, i) => {
    const title = text(get(row, 'title'))
    const company = text(get(row, 'company'))
    const stage = col('status') >= 0 ? (o.stages[norm(get(row, 'status'))] ?? autoStage(String(get(row, 'status') ?? ''))) : 'applied'
    const [status, reason] = stage.startsWith('closed:') ? ['closed' as const, stage.slice(7) as CloseReason] : [stage as Exclude<StageChoice, `closed:${string}`>, null]
    const appliedAt = parseDate(get(row, 'applied_at'), o.dateOrder)
    const url = parseUrl(get(row, 'job_url'))
    const sourceText = text(get(row, 'source'))
    const values: Prepared['values'] = {
      role: title ?? '',
      company: company ?? '',
      status,
      close_reason: reason,
      // Saved jobs haven't been applied to; anything later keeps its real date.
      applied_at: status === 'saved' ? null : appliedAt,
      job_url: url,
      location: text(get(row, 'location')),
      work_mode: parseWorkMode(get(row, 'work_mode'), col('work_mode') >= 0 ? sheet.headers[col('work_mode')] : ''),
      source: parseChannel(sourceText),
      source_detail: sourceText,
      notes: text(get(row, 'notes')),
      ...parseSalary(get(row, 'salary')),
      import_id: o.importId,
      // Board order: by applied date, newest on top; undated rows keep the sheet's order.
      position: appliedAt ? Date.parse(`${appliedAt}T12:00:00Z`) / 1000 : now - i,
    }

    const jk = title && company ? jobKey(company, title) : ''
    const uk = urlKey(url)
    let duplicate: Prepared['duplicate'] = null
    if ((jk && seenJobs.has(jk)) || (uk && seenUrls.has(uk))) duplicate = 'board'
    else if ((jk && fileJobs.has(jk)) || (uk && fileUrls.has(uk))) duplicate = 'file'
    if (jk) fileJobs.add(jk)
    if (uk) fileUrls.add(uk)

    return {
      index: i + 1,
      values,
      stage,
      duplicate,
      problem: !title && !company ? 'No title or company' : !title ? 'No job title' : !company ? 'No company' : null,
    }
  })
}

// Drop blank rows and rows that are just a repeated header.
export function cleanRows(sheet: Sheet): Sheet {
  const header = sheet.headers.map(norm).join('|')
  return {
    headers: sheet.headers,
    rows: sheet.rows.filter((r) => r.some((c) => String(c ?? '').trim() !== '') && r.map(norm).join('|') !== header),
  }
}

// First row with at least two filled cells is the header row (some sheets start with a title line).
export function toSheet(grid: Cell[][]): Sheet {
  const start = grid.findIndex((r) => r.filter((c) => String(c ?? '').trim() !== '').length >= 2)
  if (start < 0) return { headers: [], rows: [] }
  const width = Math.max(...grid.slice(start).map((r) => r.length))
  const headers = Array.from({ length: width }, (_, i) => String(grid[start][i] ?? '').trim() || `Column ${i + 1}`)
  return cleanRows({ headers, rows: grid.slice(start + 1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? '')) })
}
