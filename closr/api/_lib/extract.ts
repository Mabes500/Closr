// Turning a job posting into the fields the Add job form needs. No network access here:
// api/parse-job.ts fetches, these functions read.

export type WorkMode = 'remote' | 'hybrid' | 'onsite'
// Matches the app's job_channel values (src/lib/types.ts).
export type Channel = 'social' | 'job_board' | 'career_page' | 'referral' | 'recruiter' | 'community' | 'other'

export interface JobFields {
  title?: string
  company?: string
  location?: string
  workMode?: WorkMode
  // Whole currency units per year.
  salaryMin?: number
  salaryMax?: number
  currency?: string
  description?: string
}

export const FIELD_NAMES = ['title', 'company', 'location', 'workMode', 'salaryMin', 'salaryMax', 'currency', 'description'] as const

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', middot: '·' }

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

const clean = (s: unknown): string | undefined => {
  if (typeof s !== 'string') return undefined
  const t = decodeEntities(s).replace(/\s+/g, ' ').trim()
  return t || undefined
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

// A short summary: the first ~280 characters, cut at a word.
export function summarize(text: string | undefined, max = 280): string | undefined {
  const t = text?.replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).replace(/[\s,;:.–-]+$/, '')}…`
}

export function workModeFrom(...texts: (string | undefined)[]): WorkMode | undefined {
  const t = texts.filter(Boolean).join(' ').toLowerCase()
  if (!t) return undefined
  if (/\bhybrid\b/.test(t)) return 'hybrid'
  if (/\b(remote|work from home|wfh|telecommute|anywhere)\b/.test(t)) return 'remote'
  if (/\b(on-?site|in[- ]office|in[- ]person)\b/.test(t)) return 'onsite'
  return undefined
}

const PER_YEAR: Record<string, number> = { HOUR: 2080, DAY: 260, WEEK: 52, MONTH: 12, YEAR: 1 }

// Converts an amount per hour/day/week/month to per year.
export function annualize(n: unknown, unit: string | undefined): number | undefined {
  const v = typeof n === 'string' ? Number(n.replace(/[^0-9.]/g, '')) : n
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return undefined
  const key = (unit ?? 'YEAR').toUpperCase().replace(/^PER[-_ ]/, '').replace(/LY$/, '').replace(/S$/, '')
  return Math.round(v * (PER_YEAR[key.includes('HOUR') ? 'HOUR' : key.includes('DAY') ? 'DAY' : key.includes('WEEK') ? 'WEEK' : key.includes('MONTH') ? 'MONTH' : 'YEAR'] ?? 1))
}

const currencyCode = (c: unknown) => (typeof c === 'string' && /^[A-Za-z]{3}$/.test(c.trim()) ? c.trim().toUpperCase() : undefined)

// "acme-corp" → "Acme Corp"
export const prettify = (slug: string) =>
  decodeURIComponent(slug)
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

// "senior-software-engineer" → "Senior software engineer" (titles are sentence case in Closr).
const sentence = (slug: string) => {
  const t = decodeURIComponent(slug).replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : ''
}

// ---------------------------------------------------------------------------
// 1. JSON-LD JobPosting
// ---------------------------------------------------------------------------
type Json = Record<string, unknown>

function findJobPosting(node: unknown): Json | undefined {
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findJobPosting(n)
      if (hit) return hit
    }
    return undefined
  }
  if (!node || typeof node !== 'object') return undefined
  const o = node as Json
  const type = o['@type']
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return o
  return findJobPosting(o['@graph']) ?? findJobPosting(o.mainEntity)
}

function placeName(loc: unknown): string | undefined {
  if (!loc || typeof loc !== 'object') return clean(loc)
  const o = loc as Json
  const addr = o.address
  if (typeof addr === 'string') return clean(addr)
  if (addr && typeof addr === 'object') {
    const a = addr as Json
    const country = typeof a.addressCountry === 'object' ? (a.addressCountry as Json)?.name : a.addressCountry
    const parts = [a.addressLocality, a.addressRegion, country].map(clean).filter(Boolean)
    return [...new Set(parts)].join(', ') || clean(o.name)
  }
  return clean(o.name)
}

export function fromJsonLd(html: string): JobFields {
  const blocks = [...html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, raw] of blocks) {
    let data: unknown
    try {
      // Some sites leave raw newlines/tabs inside strings, which strict JSON rejects.
      data = JSON.parse(raw.trim().replace(/[\u0000-\u001f]+/g, ' '))
    } catch {
      continue
    }
    const job = findJobPosting(data)
    if (!job) continue

    const org = job.hiringOrganization as Json | string | undefined
    const locations = (Array.isArray(job.jobLocation) ? job.jobLocation : [job.jobLocation]).map(placeName).filter(Boolean) as string[]
    const remote = String(job.jobLocationType ?? '').toUpperCase().includes('TELECOMMUTE')
    const applicant = (Array.isArray(job.applicantLocationRequirements) ? job.applicantLocationRequirements : [job.applicantLocationRequirements])
      .map((r) => clean((r as Json | undefined)?.name))
      .filter(Boolean)
    const location =
      [...new Set(locations)].slice(0, 2).join(' / ') + (locations.length > 2 ? ` +${locations.length - 2} more` : '') ||
      (remote ? `Remote${applicant.length ? ` · ${applicant.join(', ')}` : ''}` : undefined)

    const salary = (job.baseSalary ?? job.estimatedSalary) as Json | Json[] | undefined
    const s = (Array.isArray(salary) ? salary[0] : salary) as Json | undefined
    const value = (s?.value ?? {}) as Json | number | string
    const unit = String((typeof value === 'object' ? value.unitText : undefined) ?? s?.unitText ?? 'YEAR')
    const exact = typeof value === 'object' ? value.value : value
    const salaryMin = annualize(typeof value === 'object' ? (value.minValue ?? exact) : exact, unit)
    const salaryMax = annualize(typeof value === 'object' ? (value.maxValue ?? exact) : exact, unit)

    const title = clean(job.title) ?? clean(job.name)
    // Workday often names the legal entity with a code in front: "2100 NVIDIA USA".
    const company = (typeof org === 'string' ? clean(org) : clean(org?.name))?.replace(/^\d+\s+(?=\D)/, '')
    return {
      title,
      company,
      location: location || undefined,
      workMode: remote ? 'remote' : workModeFrom(title, location, clean(job.employmentType)),
      salaryMin,
      salaryMax,
      currency: salaryMin || salaryMax ? currencyCode(s?.currency) : undefined,
      description: summarize(typeof job.description === 'string' ? stripHtml(decodeEntities(job.description)) : undefined),
    }
  }
  return {}
}

// ---------------------------------------------------------------------------
// 2. Greenhouse, Lever and Ashby public APIs
// ---------------------------------------------------------------------------
export type AtsTarget =
  | { kind: 'greenhouse'; board: string; id: string; eu: boolean }
  | { kind: 'lever'; company: string; id: string; eu: boolean }
  | { kind: 'ashby'; org: string; id: string }

export function atsTarget(url: URL): AtsTarget | null {
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean)
  if (/(^|\.)greenhouse\.io$/.test(host)) {
    const eu = host.includes('.eu.')
    // boards.greenhouse.io/acme/jobs/123, job-boards.greenhouse.io/acme/jobs/123
    const j = parts.indexOf('jobs')
    if (j > 0 && /^\d+$/.test(parts[j + 1] ?? '')) return { kind: 'greenhouse', board: parts[j - 1], id: parts[j + 1], eu }
    // boards.greenhouse.io/embed/job_app?for=acme&token=123
    const board = url.searchParams.get('for')
    const token = url.searchParams.get('token')
    if (board && token && /^\d+$/.test(token)) return { kind: 'greenhouse', board, id: token, eu }
  }
  if (/^jobs\.(eu\.)?lever\.co$/.test(host) && parts.length >= 2 && /^[0-9a-f-]{20,}$/i.test(parts[1]))
    return { kind: 'lever', company: parts[0], id: parts[1], eu: host.startsWith('jobs.eu.') }
  if (host === 'jobs.ashbyhq.com' && parts.length >= 2 && /^[0-9a-f-]{20,}$/i.test(parts[1]))
    return { kind: 'ashby', org: parts[0], id: parts[1] }
  // Company careers pages that embed Greenhouse: stripe.com/jobs/search?gh_jid=123.
  // The board is usually named after the company; if not, the API just says 404.
  const ghJid = url.searchParams.get('gh_jid')
  const board = companyLabel(host)
  if (ghJid && /^\d+$/.test(ghJid) && board) return { kind: 'greenhouse', board, id: ghJid, eu: false }
  return null
}

export function atsApiUrl(t: AtsTarget): string {
  if (t.kind === 'greenhouse')
    return `https://boards-api${t.eu ? '.eu' : ''}.greenhouse.io/v1/boards/${encodeURIComponent(t.board)}/jobs/${t.id}?pay_transparency=true`
  if (t.kind === 'lever') return `https://api${t.eu ? '.eu' : ''}.lever.co/v0/postings/${encodeURIComponent(t.company)}/${t.id}`
  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(t.org)}?includeCompensation=true`
}

const LEVER_MODE: Record<string, WorkMode> = { remote: 'remote', hybrid: 'hybrid', 'on-site': 'onsite', onsite: 'onsite' }
const ASHBY_MODE: Record<string, WorkMode> = { remote: 'remote', hybrid: 'hybrid', onsite: 'onsite' }

export function fromAts(t: AtsTarget, data: unknown): JobFields {
  if (!data || typeof data !== 'object') return {}
  const d = data as Json
  if (t.kind === 'greenhouse') {
    const pay = (Array.isArray(d.pay_input_ranges) ? d.pay_input_ranges[0] : undefined) as Json | undefined
    const location = clean((d.location as Json | undefined)?.name)
    const title = clean(d.title)
    return {
      title,
      company: clean(d.company_name) ?? prettify(t.board),
      location,
      workMode: workModeFrom(title, location),
      salaryMin: pay ? annualize(Number(pay.min_cents) / 100, 'YEAR') : undefined,
      salaryMax: pay ? annualize(Number(pay.max_cents) / 100, 'YEAR') : undefined,
      currency: pay ? currencyCode(pay.currency_type) : undefined,
      description: summarize(typeof d.content === 'string' ? stripHtml(decodeEntities(d.content)) : undefined),
    }
  }
  if (t.kind === 'lever') {
    const cat = (d.categories ?? {}) as Json
    const range = d.salaryRange as Json | undefined
    const unit = String(range?.interval ?? 'per-year-salary').replace(/^per-/, '').split('-')[0]
    const location = clean(cat.location)
    return {
      title: clean(d.text),
      company: prettify(t.company),
      location,
      workMode: LEVER_MODE[String(d.workplaceType ?? '').toLowerCase()] ?? workModeFrom(clean(d.text), location),
      salaryMin: range ? annualize(range.min, unit) : undefined,
      salaryMax: range ? annualize(range.max, unit) : undefined,
      currency: range ? currencyCode(range.currency) : undefined,
      description: summarize(clean(d.descriptionPlain) ?? (typeof d.description === 'string' ? stripHtml(d.description) : undefined)),
    }
  }
  // Ashby's public API lists the whole board; pick the posting by id.
  const job = (Array.isArray(d.jobs) ? d.jobs : []).find((j) => (j as Json)?.id === t.id) as Json | undefined
  if (!job) return {}
  const comp = ((job.compensation as Json | undefined)?.summaryComponents ?? []) as Json[]
  const salary = comp.find((c) => String(c.compensationType).toLowerCase() === 'salary')
  const unit = String(salary?.interval ?? '1 YEAR').replace(/^\d+\s*/, '')
  const location = clean(job.location)
  return {
    title: clean(job.title),
    company: prettify(t.org),
    location,
    workMode: ASHBY_MODE[String(job.workplaceType ?? '').toLowerCase()] ?? (job.isRemote ? 'remote' : workModeFrom(clean(job.title), location)),
    salaryMin: salary ? annualize(salary.minValue, unit) : undefined,
    salaryMax: salary ? annualize(salary.maxValue, unit) : undefined,
    currency: salary ? currencyCode(salary.currencyCode) : undefined,
    description: summarize(clean(job.descriptionPlain) ?? (typeof job.descriptionHtml === 'string' ? stripHtml(job.descriptionHtml) : undefined)),
  }
}

// ---------------------------------------------------------------------------
// 3. Meta tags (og:title, og:site_name, <title>, description)
// ---------------------------------------------------------------------------
// Sites whose name is the job board, not the employer.
const BOARD_NAMES = /linkedin|indeed|glassdoor|greenhouse|lever|ashby|workday|ziprecruiter|monster|wellfound|angellist|built ?in|otta|welcome to the jungle|remotive|we work remotely|remote ?ok|dice|simplyhired|careerbuilder|seek|reed|totaljobs|stepstone|jobs?\b/i

function metaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>()
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = (name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
    const key = attr('property') ?? attr('name')
    const content = attr('content')
    if (key && content) {
      const k = (key[2] ?? key[3]).toLowerCase()
      if (!tags.has(k)) tags.set(k, content[2] ?? content[3])
    }
  }
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (title) tags.set('<title>', title[1])
  return tags
}

export function fromMeta(html: string): JobFields {
  const m = metaTags(html)
  const rawTitle = clean(m.get('og:title') ?? m.get('twitter:title') ?? m.get('<title>'))
  const site = clean(m.get('og:site_name'))
  const description = summarize(clean(m.get('og:description') ?? m.get('description') ?? m.get('twitter:description')))
  if (!rawTitle) return { description }

  // LinkedIn: "Acme hiring Senior Engineer in London, United Kingdom | LinkedIn"
  const li = rawTitle.match(/^(.+?) hiring (.+?)(?: in (.+?))?\s*\|\s*LinkedIn$/i)
  if (li) return { company: li[1], title: li[2], location: li[3], workMode: workModeFrom(li[2], li[3]), description }

  // Drop a trailing "| Site" or "- Careers at Acme" part that just names the site.
  let title = rawTitle
  let company: string | undefined = site && !BOARD_NAMES.test(site) ? site : undefined
  const pieces = rawTitle.split(/\s+[|–—]\s+|\s+-\s+/)
  if (pieces.length > 1) {
    title = pieces[0]
    const rest = pieces.slice(1).find((p) => !BOARD_NAMES.test(p) && !/careers?|jobs?|hiring/i.test(p))
    company ??= rest
  }
  // "Senior Engineer at Acme"
  const at = title.match(/^(.+?)\s+at\s+(.+)$/i)
  if (at) {
    title = at[1]
    company ??= at[2]
  }
  return { title, company, workMode: workModeFrom(title), description }
}

// ---------------------------------------------------------------------------
// 4. Whatever the link itself says (used when the page can't be read)
// ---------------------------------------------------------------------------
const GENERIC_HOST_PARTS = new Set(['www', 'jobs', 'job', 'careers', 'career', 'apply', 'boards', 'job-boards', 'en', 'eu', 'us', 'uk', 'talent', 'work', 'hire'])

// The company part of a hostname: careers.acme.co.uk → "acme".
function companyLabel(host: string): string | undefined {
  const labels = host.split('.').filter((l) => !GENERIC_HOST_PARTS.has(l))
  // Drop the public suffix (com, co.uk, io...): keep the label before it.
  const name = labels.length >= 2 ? labels[labels.length - (/^(co|com|org|net|ac|gov)$/.test(labels[labels.length - 2]) && labels.length > 2 ? 3 : 2)] : labels[0]
  return name && !BOARD_NAMES.test(name) ? name : undefined
}

const companyFromHost = (host: string) => {
  const label = companyLabel(host)
  return label ? prettify(label) : undefined
}

export function fromUrl(url: URL): JobFields {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  // linkedin.com/jobs/view/senior-software-engineer-at-acme-3812345678
  if (host.endsWith('linkedin.com')) {
    const slug = parts[0] === 'jobs' && parts[1] === 'view' ? parts[2] : undefined
    const m = slug?.match(/^(.+)-at-(.+?)-\d+$/)
    return m ? { title: sentence(m[1]), company: prettify(m[2]), workMode: workModeFrom(m[1]) } : {}
  }
  // acme.wd5.myworkdayjobs.com/en-US/External/job/London/Senior-Engineer_R12345
  if (host.endsWith('myworkdayjobs.com') || host.endsWith('myworkdaysite.com')) {
    const j = parts.indexOf('job')
    const slug = j >= 0 ? parts[parts.length - 1] : undefined
    const title = slug && slug !== parts[j] ? sentence(slug.replace(/_[A-Z]*-?\d[\w-]*$/, '')) : undefined
    const location = j >= 0 && parts.length - j > 2 ? prettify(parts[j + 1]) : undefined
    return { title, company: prettify(host.split('.')[0]), location }
  }
  const ats = atsTarget(url)
  if (ats) return { company: prettify(ats.kind === 'greenhouse' ? ats.board : ats.kind === 'lever' ? ats.company : ats.org) }

  // Company careers pages: careers.acme.com/jobs/123-senior-engineer, acme.com/careers/senior-engineer
  const last = parts[parts.length - 1] ?? ''
  const slug = last.replace(/\.\w+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]\d{3,}$/, '')
  const title = /[a-z]{3,}[-_][a-z]{2,}/i.test(slug) && !/^(jobs?|careers?|openings|positions|apply)$/i.test(slug) ? sentence(slug) : undefined
  return { title, company: companyFromHost(host) }
}

// Where the link points, as the app's "source" choice.
export function channelFor(url: URL): Channel {
  const h = url.hostname.toLowerCase()
  if (/linkedin\.com$|(^|\.)x\.com$|twitter\.com$/.test(h)) return 'social'
  if (/indeed|glassdoor|ziprecruiter|monster|wellfound|angel\.co|builtin|otta|welcometothejungle|remotive|weworkremotely|remoteok|dice\.com|simplyhired|seek\.|reed\.co|totaljobs|stepstone/.test(h)) return 'job_board'
  return 'career_page'
}

// ---------------------------------------------------------------------------
// Pages that are really a block or login wall, not the posting.
// ---------------------------------------------------------------------------
export function looksBlocked(status: number, html: string): boolean {
  if ([401, 403, 407, 429, 451, 999].includes(status) || status >= 500) return true
  const head = html.slice(0, 20_000).toLowerCase()
  return (
    head.includes('authwall') ||
    head.includes('cf-challenge') ||
    head.includes('<title>just a moment') ||
    head.includes('captcha') && !head.includes('jobposting') ||
    head.includes('access denied') && head.length < 5_000
  )
}

// Earlier sources win, field by field.
export function merge(...sources: JobFields[]): JobFields {
  const out: JobFields = {}
  for (const s of sources)
    for (const k of FIELD_NAMES) if (out[k] === undefined && s[k] !== undefined && s[k] !== '') (out as Record<string, unknown>)[k] = s[k]
  // Keep the range sensible.
  if (out.salaryMin && out.salaryMax && out.salaryMax < out.salaryMin) [out.salaryMin, out.salaryMax] = [out.salaryMax, out.salaryMin]
  if (!out.salaryMin && !out.salaryMax) delete out.currency
  return out
}
