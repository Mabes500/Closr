import { supabase } from './supabase'

// The jobs feed flywheel (roadmap 6.2a, docs/JOBS-FEED-PLAN.md section 2): every
// Greenhouse, Lever or Ashby link you paste or import registers that company's board,
// so the daily pipeline starts reading its openings. Best effort: a failure here never
// gets in the way of saving the job.

export type BoardRef = { ats: 'greenhouse' | 'lever' | 'ashby'; slug: string; region?: 'eu' }

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/

// boards.greenhouse.io/acme/jobs/1, job-boards.eu.greenhouse.io/acme, jobs.lever.co/acme/…,
// jobs.eu.lever.co/acme/…, jobs.ashbyhq.com/acme/… → the board.
export function boardFromUrl(raw: string | null | undefined): BoardRef | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  const first = decodeURIComponent(url.pathname.split('/').filter(Boolean)[0] ?? '')
  const eu = host.includes('.eu.') ? ({ region: 'eu' } as const) : {}
  let ref: BoardRef | null = null
  if (/^(boards|job-boards)(\.eu)?\.greenhouse\.io$/.test(host))
    ref = { ats: 'greenhouse', slug: first === 'embed' ? (url.searchParams.get('for') ?? '') : first, ...eu }
  else if (/^jobs(\.eu)?\.lever\.co$/.test(host)) ref = { ats: 'lever', slug: first, ...eu }
  else if (host === 'jobs.ashbyhq.com') ref = { ats: 'ashby', slug: first }
  return ref && SLUG.test(ref.slug) ? ref : null
}

// Registers the boards behind these links (duplicates and unknown hosts are dropped).
export async function registerBoards(urls: (string | null | undefined)[]) {
  const seen = new Set<string>()
  const boards = urls.flatMap((u) => {
    const b = boardFromUrl(u)
    const key = b && `${b.ats}/${b.slug.toLowerCase()}`
    if (!b || !key || seen.has(key)) return []
    seen.add(key)
    return [b]
  })
  // The database takes up to 50 per call.
  for (let i = 0; i < boards.length; i += 50) {
    const { error } = await supabase.rpc('register_job_boards', { boards: boards.slice(i, i + 50) })
    if (error) return console.warn('Could not register job boards:', error.message)
  }
}
