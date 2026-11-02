import { supabase } from './supabase'
import type { JobChannel, WorkMode } from './types'

// Client for /api/parse-job (api/parse-job.ts, a Vercel function; `npm run dev` serves it too).

export interface ParsedJob {
  fields: {
    title?: string
    company?: string
    location?: string
    workMode?: WorkMode
    salaryMin?: number
    salaryMax?: number
    currency?: string
    description?: string
  }
  found: string[]
  // The page couldn't be read; only guesses from the link itself are filled in.
  blocked: boolean
  source: string | null
  channel: JobChannel
}

export async function parseJob(url: string): Promise<ParsedJob> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again.')
  const r = await fetch('/api/parse-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  })
  const body = await r.json().catch(() => null)
  if (!r.ok) throw new Error(body?.error ?? 'Couldn’t read that link.')
  return body as ParsedJob
}
