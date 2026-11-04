// The notification email: one message per person per run, grouped by type. Everything from
// the database is escaped, because job titles and company names come from outside Closr.

import type { EmailItem, EmailKind } from './rules.ts'

const HEADING: Record<EmailKind, string> = {
  interview: 'Coming up',
  followup: 'Follow-ups due',
  reminders: 'Your reminders',
  checkin: 'Weekly check-in',
  matches: 'New matching jobs',
  recap: 'Your progress',
}
const ORDER: EmailKind[] = ['interview', 'reminders', 'followup', 'checkin', 'matches', 'recap']

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// Only ever our own https links.
const safeUrl = (u: string | undefined) => (u && /^https:\/\//.test(u) ? u : undefined)

export function subjectFor(items: EmailItem[]) {
  if (items.length === 1) return items[0].title
  const kinds = new Set(items.map((i) => i.kind))
  if (kinds.size === 1 && kinds.has('matches')) return `${items.length} new jobs matching your search`
  const interview = items.find((i) => i.kind === 'interview')
  return interview ? `${interview.title}, and more from Closr` : `${items.length} updates from Closr`
}

export function renderEmail(items: EmailItem[], links: { settings: string; unsubscribe: string }) {
  const groups = ORDER.flatMap((kind) => {
    const list = items.filter((i) => i.kind === kind)
    return list.length ? [{ kind, list }] : []
  })
  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px 12px;background:#FBF8F3;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#131A2C">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #ECE5DA;border-radius:16px;padding:28px">
<div style="font-size:20px;font-weight:600;margin-bottom:20px">Closr</div>
${groups
  .map(
    ({ kind, list }) => `<div style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6B7184;margin:20px 0 8px">${HEADING[kind]}</div>
${list
  .map((i) => {
    const url = safeUrl(i.url)
    const title = escapeHtml(i.title)
    return `<div style="padding:10px 0;border-top:1px solid #ECE5DA"><div style="font-size:15px;font-weight:600;line-height:1.35">${url ? `<a href="${escapeHtml(url)}" style="color:#1A35A8;text-decoration:none">${title}</a>` : title}</div>${i.detail ? `<div style="font-size:14px;line-height:1.45;color:#3A4258;margin-top:2px">${escapeHtml(i.detail)}</div>` : ''}</div>`
  })
  .join('\n')}`,
  )
  .join('\n')}
</div>
<div style="max-width:560px;margin:14px auto 0;font-size:12px;line-height:1.5;color:#6B7184;text-align:center">
You get these because of your Closr notification settings.<br>
<a href="${escapeHtml(links.settings)}" style="color:#6B7184">Change what you get</a> &middot; <a href="${escapeHtml(links.unsubscribe)}" style="color:#6B7184">Unsubscribe from all emails</a>
</div>
</body>
</html>`
  const text = [
    ...groups.flatMap(({ kind, list }) => [
      HEADING[kind].toUpperCase(),
      ...list.flatMap((i) => [i.title, ...(i.detail ? [i.detail] : []), ...(safeUrl(i.url) ? [i.url!] : []), '']),
    ]),
    `Change what you get: ${links.settings}`,
    `Unsubscribe from all emails: ${links.unsubscribe}`,
  ].join('\n')
  return { html, text }
}
