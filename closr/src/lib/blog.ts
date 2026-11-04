// Blog posts are Markdown files in src/content/blog/ (see _template.md there). The pages only use
// the two functions below, so moving to a CMS later means changing this file, not the pages.

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  author: string
  body: string
  minutes: number
}

const FILES = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parse(path: string, raw: string): BlogPost | null {
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  if (slug.startsWith('_')) return null
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return null
  const meta = Object.fromEntries(
    m[1].split(/\r?\n/).flatMap((line) => {
      const at = line.indexOf(':')
      return at > 0 ? [[line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]] : []
    }),
  ) as Record<string, string>
  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '')) return null
  return {
    slug,
    title: meta.title,
    description: meta.description ?? '',
    date: meta.date,
    author: meta.author ?? 'The Closr team',
    body: m[2].trim(),
    minutes: Math.max(1, Math.round(m[2].trim().split(/\s+/).length / 200)),
  }
}

const ALL = Object.entries(FILES)
  .flatMap(([path, raw]) => parse(path, raw) ?? [])
  .sort((a, b) => b.date.localeCompare(a.date))

// Published posts, newest first. Posts dated in the future stay hidden.
export function listPosts() {
  const today = new Date().toISOString().slice(0, 10)
  return ALL.filter((p) => p.date <= today)
}

export const getPost = (slug: string) => listPosts().find((p) => p.slug === slug) ?? null

export const postDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
