import { lookup } from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import zlib from 'node:zlib'

// Fetching a URL a user pasted, without letting it reach our own network (SSRF):
// - http/https only, ports 80/443/8080/8443
// - hostnames like localhost/.local/.internal refused up front
// - every address the hostname resolves to is checked, and the connection is made to
//   that checked address (no second lookup), so DNS tricks can't swap in a private IP
// - redirects are followed by hand (max 5), each one checked the same way
// - 8 second overall timeout, a response size limit, normal browser user agent

const TIMEOUT_MS = 8_000
// Pages: the details sit near the top, so a long page is cut at 2 MB and still read.
// JSON (job board APIs; Ashby returns a whole board) may be larger and can't be cut.
export const PAGE_MAX_BYTES = 2 * 1024 * 1024
export const JSON_MAX_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 5
const ALLOWED_PORTS = new Set(['', '80', '443', '8080', '8443'])

export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export class FetchError extends Error {}

// Private, loopback, link-local, carrier-grade NAT, multicast and other reserved ranges.
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7)) // IPv4-mapped
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') ||
    v6.startsWith('fe8') ||
    v6.startsWith('fe9') ||
    v6.startsWith('fea') ||
    v6.startsWith('feb') ||
    v6.startsWith('ff')
  )
}

export function checkUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new FetchError('That doesn’t look like a web address.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new FetchError('Only http and https links are supported.')
  if (url.username || url.password) throw new FetchError('Links with a username or password aren’t supported.')
  if (!ALLOWED_PORTS.has(url.port)) throw new FetchError('That port isn’t allowed.')
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    (!host.includes('.') && !isIP(host))
  )
    throw new FetchError('That address isn’t reachable from the internet.')
  if (isIP(host) && isPrivateAddress(host)) throw new FetchError('That address isn’t reachable from the internet.')
  return url
}

// DNS lookup that refuses private addresses; used as the socket's lookup, so the
// address that's checked is the address that's connected to.
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0)
    const list = addresses as { address: string; family: number }[]
    const bad = list.find((a) => isPrivateAddress(a.address))
    if (bad || !list.length) return callback(new FetchError('That address isn’t reachable from the internet.'), '', 0)
    if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: typeof list) => void)(null, list)
    callback(null, list[0].address, list[0].family)
  })
}

type Response = { status: number; url: string; contentType: string; body: string }

type Limit = { maxBytes: number; truncate: boolean }

function requestOnce(
  url: URL,
  headers: Record<string, string>,
  deadline: number,
  limit: Limit,
): Promise<{ status: number; location?: string; contentType: string; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http
    const remaining = deadline - Date.now()
    if (remaining <= 0) return reject(new FetchError('The page took too long to respond.'))
    const req = lib.request(
      url,
      {
        method: 'GET',
        headers: { 'User-Agent': BROWSER_UA, 'Accept-Encoding': 'gzip, deflate, br', ...headers },
        lookup: guardedLookup,
        timeout: remaining,
      },
      (res) => {
        const status = res.statusCode ?? 0
        const contentType = String(res.headers['content-type'] ?? '')
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume()
          return resolve({ status, location: res.headers.location, contentType, body: '' })
        }
        const enc = String(res.headers['content-encoding'] ?? '').toLowerCase()
        const stream =
          enc === 'gzip' ? res.pipe(zlib.createGunzip()) : enc === 'br' ? res.pipe(zlib.createBrotliDecompress()) : enc === 'deflate' ? res.pipe(zlib.createInflate()) : res
        const chunks: Buffer[] = []
        let size = 0
        let done = false
        stream.on('data', (c: Buffer) => {
          if (done) return
          size += c.length
          if (size > limit.maxBytes) {
            done = true
            req.destroy()
            if (!limit.truncate) return reject(new FetchError('The response was too large.'))
            chunks.push(c.subarray(0, Math.max(0, c.length - (size - limit.maxBytes))))
            return resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf8') })
          }
          chunks.push(c)
        })
        stream.on('end', () => !done && resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf8') }))
        stream.on('error', (e) => !done && reject(new FetchError(`Couldn’t read the page (${e.message}).`)))
      },
    )
    req.on('timeout', () => req.destroy(new FetchError('The page took too long to respond.')))
    req.on('error', (e) => reject(e instanceof FetchError ? e : new FetchError(`Couldn’t reach the page (${(e as NodeJS.ErrnoException).code ?? e.message}).`)))
    req.end()
  })
}

// GET a URL safely; resolves for any final status (callers decide what an error means).
// `json` raises the size limit and refuses to cut the response short.
export async function safeFetch(raw: string, headers: Record<string, string> = {}, opts: { json?: boolean } = {}): Promise<Response> {
  const deadline = Date.now() + TIMEOUT_MS
  const limit: Limit = opts.json ? { maxBytes: JSON_MAX_BYTES, truncate: false } : { maxBytes: PAGE_MAX_BYTES, truncate: true }
  let url = checkUrl(raw)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const r = await requestOnce(url, headers, deadline, limit)
    if (!r.location) return { status: r.status, url: url.toString(), contentType: r.contentType, body: r.body }
    url = checkUrl(new URL(r.location, url).toString())
  }
  throw new FetchError('Too many redirects.')
}
