import type { Role } from '../data/roles'

// Search over the role catalogue (src/data/roles.ts): titles and aliases, case-insensitive,
// tolerant of small typos. Exact and starts-with matches rank first.

// Lowercase, treat - / , as spaces, keep characters that matter in titles (C++, C#, .NET).
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#.&' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// `rank` is the role's position within its field; the catalogue lists common titles first.
type Entry = { role: Role; rank: number; names: { text: string; isTitle: boolean }[] }

export type RoleIndex = { entries: Entry[]; byName: Map<string, Role>; byTitle: Map<string, Role> }

export function buildIndex(roles: Role[]): RoleIndex {
  const byName = new Map<string, Role>()
  const byTitle = new Map<string, Role>()
  const perField = new Map<string, number>()
  const entries = roles.map((role) => {
    const names = [role.title, ...role.aliases].map((n, i) => ({ text: normalize(n), isTitle: i === 0 }))
    byTitle.set(normalize(role.title), role)
    for (const n of names) if (!byName.has(n.text)) byName.set(n.text, role)
    const rank = perField.get(role.category) ?? 0
    perField.set(role.category, rank + 1)
    return { role, rank, names }
  })
  // Titles win over aliases that happen to read the same.
  for (const [k, r] of byTitle) byName.set(k, r)
  return { entries, byName, byTitle }
}

// The catalogue role whose title or alias is exactly what was typed (e.g. "swe").
export const exactRole = (index: RoleIndex, query: string) => index.byName.get(normalize(query))

// Optimal string alignment distance (Levenshtein plus swapped letters) between `a` and
// text[start, start + len), giving up past `max`. Three reused rows: this runs a lot.
const R0 = new Int32Array(64)
const R1 = new Int32Array(64)
const R2 = new Int32Array(64)
function distance(a: string, text: string, start: number, len: number, max: number) {
  if (Math.abs(a.length - len) > max || len >= 63) return max + 1
  let prev2 = R0
  let prev = R1
  let cur = R2
  for (let j = 0; j <= len; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    let best = i
    const ai = a.charCodeAt(i - 1)
    for (let j = 1; j <= len; j++) {
      const bj = text.charCodeAt(start + j - 1)
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ai === bj ? 0 : 1))
      if (i > 1 && j > 1 && ai === text.charCodeAt(start + j - 2) && a.charCodeAt(i - 2) === bj) v = Math.min(v, prev2[j - 2] + 1)
      cur[j] = v
      if (v < best) best = v
    }
    if (best > max) return max + 1
    const t = prev2
    prev2 = prev
    prev = cur
    cur = t
  }
  return prev[len]
}

// Where each word starts, so "enginer" can match the "engineer" in "software engineer".
const wordStarts = (text: string) => {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 32) starts.push(i + 1)
  return starts
}

function score(q: string, tokens: string[], text: string, isTitle: boolean) {
  const bonus = isTitle ? 50 : 0
  if (text === q) return 1000 + bonus
  if (text.startsWith(q)) return 800 + bonus
  if (` ${text}`.includes(` ${q}`)) return 600 + bonus
  // Every typed word starts a word in the name: "prod man" → "product manager".
  if (tokens.length > 1) {
    const words = text.split(' ')
    if (tokens.every((t) => words.some((w) => w.startsWith(t)))) return 500 + bonus
  }
  // Mid-word matches only from 3 letters, or "rn" would match "intern".
  if (q.length >= 3 && text.includes(q)) return 300 + bonus
  return 0
}

function fuzzyScore(q: string, text: string, isTitle: boolean) {
  const max = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0
  if (!max) return 0
  let best = max + 1
  for (const start of wordStarts(text)) {
    // A typo rarely hits both of the first two letters, so skip windows that miss both.
    if (text[start] !== q[0] && text[start + 1] !== q[1] && text[start] !== q[1]) continue
    for (let len = q.length - max; len <= q.length + max && best > 0; len++) {
      if (len < 1 || start + len > text.length) continue
      best = Math.min(best, distance(q, text, start, len, max))
    }
  }
  return best <= max ? 200 - best * 50 + (isTitle ? 25 : 0) : 0
}

// Best matches for what's been typed, skipping titles already chosen (lowercased in `exclude`).
export function searchRoles(index: RoleIndex, query: string, exclude: Set<string>, limit = 8): Role[] {
  const q = normalize(query)
  if (!q) return []
  const tokens = q.split(' ')
  const scored: { e: Entry; s: number }[] = []
  const rest: Entry[] = []
  for (const e of index.entries) {
    if (exclude.has(e.role.title.toLowerCase())) continue
    const s = Math.max(...e.names.map((n) => score(q, tokens, n.text, n.isTitle)))
    if (s) scored.push({ e, s })
    else rest.push(e)
  }
  // Typo-tolerant pass only when exact-ish matches don't fill the list.
  if (scored.length < limit)
    for (const e of rest) {
      const s = Math.max(...e.names.map((n) => fuzzyScore(q, n.text, n.isTitle)))
      if (s) scored.push({ e, s })
    }
  // Same score: more common within its field first, then shorter titles.
  return scored
    .sort((a, b) => b.s - a.s || a.e.rank - b.e.rank || a.e.role.title.length - b.e.role.title.length)
    .slice(0, limit)
    .map((x) => x.e.role)
}

// Titles from the same field as the most recently added catalogue role, most common first.
export function relatedTitles(index: RoleIndex, chosen: string[], limit = 8): string[] | null {
  const taken = new Set(chosen.map((c) => c.toLowerCase()))
  for (let i = chosen.length - 1; i >= 0; i--) {
    const role = index.byTitle.get(normalize(chosen[i])) ?? index.byName.get(normalize(chosen[i]))
    if (!role) continue
    return index.entries
      .filter((e) => e.role.category === role.category && !taken.has(e.role.title.toLowerCase()))
      .slice(0, limit)
      .map((e) => e.role.title)
  }
  return null
}
