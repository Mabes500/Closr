import {
  FIELD_NAMES,
  atsApiUrl,
  atsTarget,
  channelFor,
  fromAts,
  fromJsonLd,
  fromMeta,
  fromUrl,
  looksBlocked,
  merge,
  type JobFields,
} from './_lib/extract.js'
import { FetchError, checkUrl, safeFetch } from './_lib/safeFetch.js'

// POST /api/parse-job  { url }  (roadmap 2.1, a Vercel serverless function)
// Reads a job posting so the Add job form can be pre-filled. Signed-in users only:
// the app sends its Supabase access token, which is checked with Supabase Auth.
//
// Sources, earliest wins per field: the page's JSON-LD JobPosting, the Greenhouse /
// Lever / Ashby public API when the link is one of theirs, the page's meta tags, and
// finally what the link itself says. If the page can't be read the answer still
// succeeds, with `blocked: true` and the link-based guesses.
//
// LinkedIn links are never fetched: LinkedIn's terms prohibit automated collection
// (docs/JOBS-FEED-PLAN.md section 7). The link is kept and the user fills in the rest.

export type ParseJobResponse = {
  fields: JobFields
  // Which fields have a value.
  found: (typeof FIELD_NAMES)[number][]
  // The page couldn't be read; only what the link itself says is filled in.
  blocked: boolean
  // Where the title came from: jsonld, greenhouse, lever, ashby, meta or url.
  source: string | null
  // The app's "source" choice for this link (job_board, social, career_page...).
  channel: string
  // Set when the page was deliberately not read: 'linkedin'.
  skipped?: 'linkedin'
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

// Supabase settings come from the same variables the app uses (set in Vercel).
const SUPABASE_URL = () => process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = () => process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

// Asks Supabase Auth whether the token belongs to a signed-in user.
async function isSignedIn(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return false
  try {
    const r = await fetch(`${SUPABASE_URL()}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY()!, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    })
    return r.ok
  } catch {
    return false
  }
}

async function readPage(url: string): Promise<{ jsonld: JobFields; meta: JobFields; readable: boolean }> {
  try {
    const page = await safeFetch(url, { Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' })
    if (looksBlocked(page.status, page.body) || page.status >= 400 || !/html|xml/i.test(page.contentType))
      return { jsonld: {}, meta: {}, readable: false }
    return { jsonld: fromJsonLd(page.body), meta: fromMeta(page.body), readable: true }
  } catch {
    return { jsonld: {}, meta: {}, readable: false }
  }
}

async function readAts(url: URL): Promise<{ fields: JobFields; kind: string } | null> {
  const target = atsTarget(url)
  if (!target) return null
  try {
    const r = await safeFetch(atsApiUrl(target), { Accept: 'application/json' }, { json: true })
    if (r.status !== 200) return null
    return { fields: fromAts(target, JSON.parse(r.body)), kind: target.kind }
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!SUPABASE_URL() || !SUPABASE_ANON_KEY())
    return json(500, { error: 'The server is missing its Supabase settings (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' })
  if (!(await isSignedIn(request))) return json(401, { error: 'Please sign in again.' })

  let raw: unknown
  try {
    raw = ((await request.json()) as { url?: unknown }).url
  } catch {
    return json(400, { error: 'Send JSON like { "url": "https://…" }.' })
  }
  if (typeof raw !== 'string' || !raw.trim() || raw.length > 2048) return json(400, { error: 'Paste a job link.' })

  let url: URL
  try {
    url = checkUrl(raw.trim())
  } catch (e) {
    return json(400, { error: e instanceof FetchError ? e.message : 'That link can’t be read.' })
  }

  if (/(^|\.)linkedin\.com$/i.test(url.hostname)) {
    const fields = merge(fromUrl(url))
    const body: ParseJobResponse = {
      fields,
      found: FIELD_NAMES.filter((k) => fields[k] !== undefined),
      blocked: true,
      source: fields.title ? 'url' : null,
      channel: channelFor(url),
      skipped: 'linkedin',
    }
    return json(200, body)
  }

  const [page, ats] = await Promise.all([readPage(url.toString()), readAts(url)])
  const guess = fromUrl(url)
  const fields = merge(page.jsonld, ats?.fields ?? {}, page.meta, guess)

  const source = page.jsonld.title
    ? 'jsonld'
    : ats?.fields.title
      ? ats.kind
      : page.meta.title
        ? 'meta'
        : guess.title
          ? 'url'
          : null
  const body: ParseJobResponse = {
    fields,
    found: FIELD_NAMES.filter((k) => fields[k] !== undefined),
    blocked: !page.readable && !ats?.fields.title,
    source,
    channel: channelFor(url),
  }
  return json(200, body)
}
