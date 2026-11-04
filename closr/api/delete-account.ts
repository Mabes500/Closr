import { createClient } from '@supabase/supabase-js'

// POST /api/delete-account  { email }  (roadmap 7.1, a Vercel serverless function)
// Permanently deletes the signed-in user. The app's Supabase access token proves who is
// asking, and the email they typed must be theirs. Deleting the auth user removes all
// their data: every table holding user data references auth.users with ON DELETE CASCADE.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in Vercel's project settings (never a VITE_* variable).
// It stays on the server; only this function uses it.

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }

export async function POST(request: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !secretKey) return json(500, { error: 'Account deletion isn’t set up on the server yet. Nothing was deleted.' })

  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return json(401, { error: 'Please sign in again.' })
  const { data, error } = await createClient(url, anonKey, clientOptions).auth.getUser(token)
  if (error || !data.user) return json(401, { error: 'Please sign in again.' })

  let email: unknown
  try {
    email = ((await request.json()) as { email?: unknown }).email
  } catch {
    return json(400, { error: 'Type your email to confirm.' })
  }
  const same = (a: string) => a.trim().toLowerCase()
  if (typeof email !== 'string' || !data.user.email || same(email) !== same(data.user.email))
    return json(400, { error: 'That email doesn’t match your account. Nothing was deleted.' })

  const { error: deleteError } = await createClient(url, secretKey, clientOptions).auth.admin.deleteUser(data.user.id)
  if (deleteError) {
    console.error('delete-account failed:', deleteError.message)
    return json(500, { error: 'Your account couldn’t be deleted. Nothing was removed; please try again.' })
  }
  return json(200, { deleted: true })
}
