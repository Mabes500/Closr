// The pipeline's Supabase connection. Uses the service-role (secret) key, which bypasses
// RLS so it can write the shared job tables. It only ever runs in GitHub Actions (or on
// the owner's machine); it is never part of the app or a VITE_* variable.

import { createClient } from '@supabase/supabase-js'

export function connect() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them as GitHub repository secrets (see .github/workflows/jobs-feed.yml).')
    process.exit(1)
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export type Db = ReturnType<typeof connect>

// Runs `fn` over `items` with at most `n` running at once.
export async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker))
}

// Reads every row of a query, 1,000 at a time (Supabase returns at most 1,000 per request).
export async function all<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999)
    if (error) throw new Error(`database: ${error.message}`)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) return out
  }
}

export const chunks = <T>(xs: T[], size: number) => Array.from({ length: Math.ceil(xs.length / size) }, (_, i) => xs.slice(i * size, (i + 1) * size))
