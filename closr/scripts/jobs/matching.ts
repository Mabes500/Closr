// Matching (roadmap 6.2c, docs/JOBS-FEED-PLAN.md section 4): which fresh postings suit a
// person, how well, and the short reasons shown on the card. No database here.

import { ROLES, type RoleCategory } from '../../src/data/roles.ts'
import { normalize } from '../../src/lib/roleSearch.ts'
import { countriesIn } from './ats.ts'
import { matchRole, type Region } from './rules.ts'

export interface MatchProfile {
  target_roles: string[]
  work_setups: string[] // remote | hybrid | onsite; empty = any
  locations: string | null // free text, e.g. "London or remote in the EU"
  work_countries: string[]
  needs_visa_sponsorship: boolean | null
  salary_floor: number | null // per year
  salary_floor_currency: string | null
}

export interface MatchPosting {
  id: string
  title: string
  location: string | null
  countries: string[]
  work_mode: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  first_seen_at: string
  posted_at: string | null
  role_category: string | null
  role_title: string | null
  visa_sponsorship: string | null
  remote_regions: string[]
  remote_countries: string[]
}

export const FRESH_DAYS = 14
export const MAX_PER_DAY = 15

// ---------------------------------------------------------------------------
// The person's targets, worked out once.
// ---------------------------------------------------------------------------
type Target = { label: string; title: string | null; names: Set<string>; category: RoleCategory | null; text: string; words: string[] }

// Words too general to show two titles are the same kind of job.
const GENERIC = new Set(['senior', 'junior', 'lead', 'staff', 'principal', 'head', 'manager', 'director', 'specialist', 'associate', 'assistant', 'officer', 'and', 'of', 'the', 'for', 'intern'])
// A rough common form, so "engineers", "engineering" and "engineer" compare equal.
const singular = (w: string) =>
  w
    .replace(/(ies)$/, 'y')
    .replace(/([^s])s$/, '$1')
    .replace(/(.{4,})ing$/, '$1')

export interface Prepared {
  targets: Target[]
  wantsInternship: boolean
  setups: Set<string>
  places: string[] // lowercase place words from "locations", e.g. "london"
  countries: Set<string>
  regions: Set<Region>
  needsVisa: boolean
  floor: { amount: number; currency: string } | null
}

// Which broad regions a country belongs to, for remote postings limited by region.
const REGION_OF: Record<string, Region[]> = {}
const add = (regions: Region[], codes: string) => codes.split(' ').forEach((c) => (REGION_OF[c] = [...(REGION_OF[c] ?? []), ...regions]))
add(['europe', 'emea'], 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB CH NO IS LI AL BA ME MK RS MD UA')
add(['north_america', 'americas'], 'US CA')
add(['latam', 'americas'], 'MX BR AR CL CO PE UY PY BO EC VE CR PA GT HN SV NI DO PR CU JM TT')
add(['north_america'], 'MX')
add(['apac', 'asia'], 'CN HK TW JP KR SG MY TH VN PH ID IN PK BD LK NP KH MM')
add(['apac', 'oceania'], 'AU NZ')
add(['middle_east', 'emea'], 'AE SA QA KW BH OM IL JO LB TR IQ')
add(['africa', 'emea'], 'ZA NG KE EG MA GH TN ET UG TZ RW SN CI DZ')

const CATALOGUE = new Map(ROLES.map((r) => [r.title, r]))

export function prepare(p: MatchProfile): Prepared {
  const targets = p.target_roles.map((label) => {
    const role = matchRole(label)
    const cat = role ? CATALOGUE.get(role.title) : undefined
    return {
      label,
      title: role?.title ?? null,
      names: new Set([role?.title, ...(cat?.aliases ?? [])].filter(Boolean).map((n) => normalize(n!))),
      category: role?.category ?? null,
      text: normalize(label),
      words: [...new Set(normalize(`${label} ${role?.title ?? ''}`).split(' ').map(singular))].filter((w) => w.length >= 3 && !GENERIC.has(w)),
    }
  })
  const places = (p.locations ?? '')
    .toLowerCase()
    .split(/[,;/|]|\bor\b|\band\b|\bin\b/)
    .map((s) => s.replace(/\b(remote|hybrid|onsite|on-site|anywhere|the)\b/g, '').trim())
    .filter((s) => s.length >= 3)
  const countries = new Set([...p.work_countries, ...countriesIn(p.locations)])
  const regions = new Set<Region>(['worldwide', ...[...countries].flatMap((c) => REGION_OF[c] ?? [])])
  if (/\b(eu|europe|european union)\b/i.test(p.locations ?? '')) regions.add('europe')
  return {
    targets,
    wantsInternship: p.target_roles.some((r) => /\b(intern|internship|working student|placement)\b/i.test(r)),
    setups: new Set(p.work_setups),
    places,
    countries,
    regions,
    needsVisa: p.needs_visa_sponsorship === true,
    floor: p.salary_floor && p.salary_floor_currency ? { amount: p.salary_floor, currency: p.salary_floor_currency } : null,
  }
}

// ---------------------------------------------------------------------------
// One posting against one person: null if it fails a hard rule, else a score and reasons.
// ---------------------------------------------------------------------------
const PER_YEAR: Record<string, number> = { year: 1, month: 12, week: 52, day: 260, hour: 2080 }
const MODE_LABEL: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' }
const DAY = 86_400_000

export function score(post: MatchPosting, me: Prepared, now = Date.now()): { score: number; reasons: string[] } | null {
  const reasons: string[] = []
  let s = 0

  // Role (required): the same catalogue role (title or alias) scores highest; the same
  // field less; plain text for roles typed that aren't in the catalogue.
  const title = normalize(post.title)
  const titleWords = new Set(title.split(' ').map(singular))
  // Internships only for people looking for one.
  if (/\b(intern|internship|working student|werkstudent)\b/.test(title) && !me.wantsInternship) return null
  let role = 0
  let roleReason = ''
  for (const t of me.targets) {
    let r = 0
    if (t.title && post.role_title === t.title) r = 50
    else if ([...t.names].some((n) => n.length >= 3 && ` ${title} `.includes(` ${n} `))) r = 45
    else if (!t.title && t.text.length >= 3 && ` ${title} `.includes(` ${t.text} `)) r = 40
    // Same field alone is too loose ("Sales compensation design lead" isn't a product
    // designer job): it also needs a meaningful word from the role in the title.
    else if (t.category && post.role_category === t.category && t.words.some((w) => titleWords.has(w))) r = 15
    if (r > role) {
      role = r
      roleReason = r >= 40 ? `Matches ${t.label}` : `In your field (${t.label})`
    }
  }
  if (!role) return null
  s += role
  reasons.push(roleReason)

  // Work setup (required when the person chose any): unknown is allowed, scored lower.
  if (me.setups.size && post.work_mode) {
    if (!me.setups.has(post.work_mode)) return null
    s += 10
  }

  // Location: onsite/hybrid in or near a chosen place; remote open to the person's
  // country or region. Unknowns are allowed.
  const where = (post.location ?? '').toLowerCase()
  if (post.work_mode === 'remote') {
    if (post.remote_countries.length && me.countries.size) {
      if (!post.remote_countries.some((c) => me.countries.has(c))) return null
      s += 10
      reasons.push('Open to your country')
    } else if (post.remote_regions.length && me.countries.size) {
      if (!post.remote_regions.some((r) => me.regions.has(r as Region))) return null
      s += 10
      reasons.push(post.remote_regions.includes('worldwide') ? 'Remote, anywhere' : 'Open to your region')
    } else reasons.push(MODE_LABEL.remote)
  } else if (me.places.length || me.countries.size) {
    const inPlace = me.places.some((p) => where.includes(p))
    const inCountry = post.countries.some((c) => me.countries.has(c))
    if (inPlace) {
      s += 12
      reasons.push(post.work_mode ? `${MODE_LABEL[post.work_mode]} near you` : 'Near you')
    } else if (inCountry && !me.places.length) {
      s += 8
      reasons.push('In your country')
    } else if (post.location || post.countries.length) return null
  }

  // Visa: if sponsorship is needed, "no" is a hard no and "yes" ranks higher.
  if (me.needsVisa) {
    if (post.visa_sponsorship === 'no') return null
    if (post.visa_sponsorship === 'yes') {
      s += 15
      reasons.push('Sponsors visa')
    }
  } else if (post.visa_sponsorship === 'yes' && !me.countries.size) reasons.push('Sponsors visa')

  // Salary: hidden only when it states a top of range (or a single figure) below the floor,
  // in the same currency. Unknown salary is fine.
  if (me.floor && post.salary_currency === me.floor.currency && post.salary_period && PER_YEAR[post.salary_period]) {
    const top = (post.salary_max ?? post.salary_min ?? 0) * PER_YEAR[post.salary_period]
    if (top && top < me.floor.amount) return null
    if (top) {
      s += 5
      reasons.push('Meets your salary floor')
    }
  }

  // Freshness: up to 20 points, fading over two weeks.
  const seen = Date.parse(post.posted_at && post.posted_at > post.first_seen_at ? post.posted_at : post.first_seen_at)
  const age = Math.max(0, (now - seen) / DAY)
  s += Math.max(0, 20 * (1 - age / FRESH_DAYS))
  if (age < 2) reasons.push('New')

  return { score: Math.round(s * 100) / 100, reasons: reasons.slice(0, 4) }
}

// The best postings for one person today, highest score first.
export function topMatches(posts: MatchPosting[], me: Prepared, skip: Set<string>, limit = MAX_PER_DAY, now = Date.now()) {
  const out: { posting: MatchPosting; score: number; reasons: string[] }[] = []
  for (const p of posts) {
    if (skip.has(p.id)) continue
    const r = score(p, me, now)
    if (r) out.push({ posting: p, ...r })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}
