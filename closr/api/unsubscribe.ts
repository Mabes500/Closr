import { createClient } from '@supabase/supabase-js'
import { validSignature } from './_lib/unsubscribe.js'

// /api/unsubscribe?u=<user id>&s=<signature>  (roadmap 7.2, a Vercel serverless function)
// GET shows a confirmation page and changes nothing, because email scanners open links on
// their own. POST turns off every email type; mail apps' one-click unsubscribe (RFC 8058)
// POSTs here too. In Closr notifications aren't affected.
//
// Needs SUPABASE_SERVICE_ROLE_KEY and EMAIL_UNSUBSCRIBE_SECRET in Vercel (not VITE_*).

const page = (status: number, heading: string, body: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Closr emails</title></head>
<body style="margin:0;padding:48px 16px;background:#FBF8F3;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#131A2C;text-align:center">
<div style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #ECE5DA;border-radius:16px;padding:28px">
<h1 style="font-size:22px;margin:0 0 10px">${heading}</h1>${body}
</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  )

const invalid = () => page(400, 'This link isn’t valid', '<p>You can change your emails in Closr under Settings → Notifications.</p>')

function linkParams(request: Request) {
  const url = new URL(request.url)
  const u = url.searchParams.get('u') ?? ''
  const s = url.searchParams.get('s') ?? ''
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET
  return secret && /^[0-9a-f-]{36}$/i.test(u) && validSignature(u, s, secret) ? { u, s } : null
}

export async function GET(request: Request): Promise<Response> {
  const p = linkParams(request)
  if (!p) return invalid()
  return page(
    200,
    'Unsubscribe from Closr emails?',
    `<p style="line-height:1.5;color:#3A4258">You'll stop getting all Closr emails. Notifications inside Closr stay on.</p>
<form method="post"><button style="margin-top:8px;padding:11px 20px;border:0;border-radius:10px;background:#002147;color:#fff;font-size:15px;font-weight:600;cursor:pointer">Unsubscribe</button></form>`,
  )
}

export async function POST(request: Request): Promise<Response> {
  const p = linkParams(request)
  if (!p) return invalid()
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return page(500, 'That didn’t work', '<p>Please change your emails in Closr under Settings → Notifications.</p>')

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await db.from('profiles').select('notification_prefs').eq('id', p.u).maybeSingle()
  // Already deleted: there's nothing to send to, so the answer is still "you're unsubscribed".
  if (!error && data) {
    const prefs = (data.notification_prefs ?? {}) as Record<string, { app?: boolean; email?: boolean }>
    const off = Object.fromEntries(Object.entries(prefs).map(([k, v]) => [k, { ...v, email: false }]))
    const { error: updateError } = await db.from('profiles').update({ notification_prefs: off }).eq('id', p.u)
    if (updateError) return page(500, 'That didn’t work', '<p>Please try again, or change your emails in Closr under Settings → Notifications.</p>')
  } else if (error) return page(500, 'That didn’t work', '<p>Please try again, or change your emails in Closr under Settings → Notifications.</p>')
  return page(200, 'You’re unsubscribed', '<p style="line-height:1.5;color:#3A4258">You won’t get any more Closr emails. You can turn them back on in Settings → Notifications.</p>')
}
