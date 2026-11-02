import {
  Coffee,
  Compass,
  FileSpreadsheet,
  Gauge,
  LayoutGrid,
  Leaf,
  Link,
  MessagesSquare,
  Send,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { PACE_TARGET, type SearchStage, type WeeklyPace } from './types'

// Copy and options from docs/prototype.html (OB_STEPS, OB_SUGGEST, PACES).

export type StartChoice = 'import' | 'link' | 'fresh'

type Option<T extends string> = { id: T; icon: LucideIcon; label: string; sub: string; tag?: string }

export const STAGE_OPTIONS: Option<SearchStage>[] = [
  { id: 'starting', icon: Compass, label: 'Just getting started', sub: "We'll help you build a list worth applying to" },
  { id: 'applying', icon: Send, label: 'Already applying', sub: "We'll keep every application and follow-up in one place" },
  { id: 'interviewing', icon: MessagesSquare, label: 'Interviewing somewhere', sub: "We'll keep your interview prep and dates on track" },
  { id: 'browsing', icon: Coffee, label: 'Quietly looking', sub: 'No pressure — save roles as they catch your eye' },
]

export const PACE_OPTIONS: Option<WeeklyPace>[] = [
  { id: 'ease', icon: Leaf, label: 'Ease off', sub: `${PACE_TARGET.ease} applications a week` },
  { id: 'steady', icon: Gauge, label: 'Steady', sub: `${PACE_TARGET.steady} applications a week`, tag: 'Most people pick this' },
  { id: 'push', icon: Zap, label: 'All in', sub: `${PACE_TARGET.push} applications a week` },
]

export const START_OPTIONS: Option<StartChoice>[] = [
  { id: 'import', icon: FileSpreadsheet, label: 'Import a spreadsheet', sub: "Upload your CSV or sheet — we'll match the columns" },
  { id: 'link', icon: Link, label: 'Paste a job link', sub: 'Add the first role you have your eye on' },
  { id: 'fresh', icon: LayoutGrid, label: 'Start with an empty board', sub: 'Add jobs whenever you find them' },
]

export const OB_STEPS = [
  {
    key: 'stage',
    title: 'Where are you in your search?',
    sub: "Three quick questions so Closr fits how you're searching. Skip anything — we'll pick sensible defaults.",
  },
  { key: 'roles', title: 'What roles are you looking at?', sub: 'Add one, a few, or none yet. This helps us find relevant openings on Jobs.' },
  { key: 'pace', title: 'How much do you want to take on each week?', sub: "We'll turn this into a gentle weekly target. Lighter weeks are still progress." },
  {
    key: 'source',
    title: 'Got jobs tracked somewhere already?',
    sub: "Bring them over and your board is ready on day one. Or start fresh — that's fine too.",
  },
] as const

export const OB_SUGGEST = [
  'Product designer',
  'Content marketing manager',
  'Software engineer',
  'Data analyst',
  'Project manager',
  'Customer success manager',
  'Marketing manager',
  'UX researcher',
]

export const PACES: Record<WeeklyPace, { label: string; note: string }> = {
  ease: { label: 'Ease off', note: "A lighter pace is still progress. We'll keep nudges gentle." },
  steady: { label: 'Steady', note: 'A rhythm you can keep up. Consistency adds up over a few weeks.' },
  push: { label: 'All in', note: "Big week energy. We'll surface follow-ups first so nothing slips." },
}

// Tidy a typed role: collapse spaces, capitalise the first letter.
export const cleanRole = (raw: string) => {
  const t = raw.trim().replace(/\s+/g, ' ')
  return t && t.charAt(0).toUpperCase() + t.slice(1)
}
