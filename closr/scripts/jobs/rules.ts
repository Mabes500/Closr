// Enrichment by rules (roadmap 6.2b, docs/JOBS-FEED-PLAN.md section 3 step 4): what can be
// read reliably from the title, location and plain statements in the description, before
// any AI is used. No network or database here.

import { ROLES, ROLE_CATEGORY_LABEL, type RoleCategory } from '../../src/data/roles.ts'
import { buildIndex, normalize } from '../../src/lib/roleSearch.ts'

export const CATEGORIES = Object.keys(ROLE_CATEGORY_LABEL) as RoleCategory[]
export const SENIORITIES = ['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'lead', 'manager', 'director', 'executive'] as const
export type Seniority = (typeof SENIORITIES)[number]
export const REGIONS = ['worldwide', 'americas', 'north_america', 'latam', 'europe', 'emea', 'apac', 'asia', 'africa', 'middle_east', 'oceania'] as const
export type Region = (typeof REGIONS)[number]
export type Visa = 'yes' | 'no' | 'not_stated'

export interface Enrichment {
  role_category: RoleCategory | null
  role_title: string | null
  seniority: Seniority | null
  visa_sponsorship: Visa | null
  remote_regions: Region[]
  remote_countries: string[]
  timezone_note: string | null
}

// ---------------------------------------------------------------------------
// Role: the catalogue title (or alias) the posting's title names.
// ---------------------------------------------------------------------------
const index = buildIndex(ROLES)

// Words that say the level, not the role.
const LEVEL_WORDS = /\b(senior|sr|junior|jr|lead|staff|principal|head of|associate|entry level|graduate|intern(ship)?|trainee|mid level|mid|i{1,3}|iv|[1-5])\b/g

function variants(title: string): string[] {
  const t = title.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
  const out = new Set<string>()
  // As written first ("Associate product manager" is itself a catalogue title), then without level words.
  const add = (s: string) => {
    const n = normalize(s)
    if (n) out.add(n)
    const bare = n.replace(LEVEL_WORDS, ' ').replace(/\s+/g, ' ').trim()
    if (bare) out.add(bare)
  }
  add(t)
  // "Software Engineer, Backend" / "Engineer - Payments": each part, and "backend engineer".
  const parts = t.split(/\s*[,|/–—]\s*|\s+-\s+|\s+at\s+/i).filter(Boolean)
  for (const p of parts) add(p)
  if (parts.length > 1) add(`${parts[1]} ${parts[0]}`)
  return [...out]
}

// Catalogue names of at least this many characters may match inside a longer title.
const MIN_INNER = 6

export function matchRole(title: string): { title: string; category: RoleCategory } | null {
  const vs = variants(title)
  for (const v of vs) {
    const r = index.byName.get(v)
    if (r) return { title: r.title, category: r.category }
  }
  // The longest catalogue name that appears as whole words in the title.
  let best: { len: number; title: string; category: RoleCategory } | null = null
  for (const v of vs) {
    const padded = ` ${v} `
    for (const [name, r] of index.byName) {
      if (name.length < MIN_INNER || name.length <= (best?.len ?? 0)) continue
      if (padded.includes(` ${name} `)) best = { len: name.length, title: r.title, category: r.category }
    }
  }
  return best && { title: best.title, category: best.category }
}

// ---------------------------------------------------------------------------
// Seniority from the title.
// ---------------------------------------------------------------------------
export function seniorityFrom(title: string): Seniority | null {
  const t = ` ${normalize(title)} `
  if (/ (intern|internship|working student|werkstudent) /.test(t)) return 'intern'
  if (/ (chief|cto|ceo|cfo|coo|cmo|cpo|vp|vice president|svp|evp) /.test(t)) return 'executive'
  if (/ (director|head of) /.test(t)) return 'director'
  if (/ principal /.test(t)) return 'principal'
  if (/ staff /.test(t)) return 'staff'
  if (/ (lead|tech lead|team lead) /.test(t)) return 'lead'
  if (/ (senior|sr) | iii /.test(t)) return 'senior'
  if (/ (junior|jr|graduate|entry level|new grad|apprentice|trainee) | i /.test(t)) return 'junior'
  if (/ (mid level|intermediate) | ii /.test(t)) return 'mid'
  if (/ (engineering|people|team) manager /.test(t)) return 'manager'
  return null
}

// ---------------------------------------------------------------------------
// Visa sponsorship: only clear statements count; anything else is left for the AI.
// ---------------------------------------------------------------------------
const VISA_NO = [
  /\b(unable|not able|cannot|can ?not|can't|won't|will not|do not|don't|does not|doesn't|are not able|is not able)\s+(to\s+)?(currently\s+)?(provide|offer|sponsor|support|consider)\w*\b[^.\n]{0,40}\b(visa|sponsorship|work (authori[sz]ation|permit)|immigration)/i,
  /\b(visa|immigration)?\s*sponsorship\s+(is\s+)?(not|unavailable|isn't)\b/i,
  /\bnot\s+(eligible|available)\s+for\s+(visa\s+)?sponsorship\b/i,
  /\bno\s+(visa\s+)?sponsorship\b/i,
  /\bwithout\s+(the\s+)?(need\s+for\s+)?(current\s+or\s+future\s+)?(visa\s+)?sponsorship\b/i,
]
const VISA_YES = [
  /\b(visa|immigration)\s+sponsorship\s+(is\s+)?(available|provided|offered|possible)\b/i,
  /\b(we|company)\s+(can|will|do|are able to|is able to)\s+(provide|offer|sponsor|support)\w*\s+(visa|work (permit|visa)|sponsorship|relocation and visa)/i,
  /\b(offer|provide)s?\s+(full\s+)?visa\s+(sponsorship|support)\b/i,
  /\bvisa\s+sponsorship\s+and\s+relocation\b|\brelocation\s+and\s+visa\s+(support|sponsorship)\b/i,
]
export function visaFrom(description: string | null): Visa | null {
  if (!description) return null
  if (VISA_NO.some((r) => r.test(description))) return 'no'
  if (VISA_YES.some((r) => r.test(description))) return 'yes'
  return null
}

// ---------------------------------------------------------------------------
// Remote limits from the location text (the description is left to the AI).
// ---------------------------------------------------------------------------
const REGION_WORDS: [RegExp, Region][] = [
  [/\b(worldwide|anywhere|global(ly)?|fully distributed)\b/i, 'worldwide'],
  [/\bemea\b/i, 'emea'],
  [/\b(europe|european union|\beu\b|eea)\b/i, 'europe'],
  [/\b(latam|latin america|south america)\b/i, 'latam'],
  [/\b(north america|n\.? america)\b/i, 'north_america'],
  [/\bamericas\b/i, 'americas'],
  [/\b(apac|asia[- ]pacific)\b/i, 'apac'],
  [/\basia\b/i, 'asia'],
  [/\bafrica\b/i, 'africa'],
  [/\b(middle east|mena|gcc)\b/i, 'middle_east'],
  [/\b(oceania|anz)\b/i, 'oceania'],
]
export function regionsFrom(location: string | null): Region[] {
  if (!location) return []
  return [...new Set(REGION_WORDS.filter(([r]) => r.test(location)).map(([, k]) => k))]
}

export function timezoneFrom(text: string | null): string | null {
  if (!text) return null
  const m = text.match(/\b(?:UTC|GMT)\s?[+−-]\s?\d{1,2}(?::?\d{2})?(?:\s*(?:to|-|–|and)\s*(?:UTC|GMT)?\s?[+−-]\s?\d{1,2}(?::?\d{2})?)?/i)
  return m ? m[0].replace(/\s+/g, ' ').slice(0, 120) : null
}

// Everything the rules can tell about one posting.
export function enrichByRules(p: { title: string; location: string | null; description: string | null; work_mode: string | null; countries: string[] }): Enrichment {
  const role = matchRole(p.title)
  const remote = p.work_mode === 'remote' || /\bremote\b/i.test(p.location ?? '')
  return {
    role_category: role?.category ?? null,
    role_title: role?.title ?? null,
    seniority: seniorityFrom(p.title),
    visa_sponsorship: visaFrom(p.description),
    remote_regions: remote ? regionsFrom(p.location) : [],
    // A remote job listed with countries is open in those countries.
    remote_countries: remote ? p.countries : [],
    timezone_note: timezoneFrom(p.location) ?? timezoneFrom(p.description),
  }
}

// What's still unknown, which is what the AI pass is asked about.
export const gaps = (e: Enrichment, workMode: string | null) =>
  [!e.role_category && 'role', !e.seniority && 'seniority', !e.visa_sponsorship && 'visa', !workMode && 'work_mode'].filter(Boolean) as string[]
