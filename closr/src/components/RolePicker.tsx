import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { buildIndex, exactRole, normalize, relatedTitles, searchRoles, type RoleIndex } from '../lib/roleSearch'
import { Input, RoleChip, SuggestChip } from './ui'

// The catalogue (src/data/roles.ts, ~100 KB) is fetched the first time a picker appears,
// not with the app, and shared by every picker after that.
let indexPromise: Promise<{ index: RoleIndex; popular: string[] }> | null = null
const loadIndex = () =>
  (indexPromise ??= import('../data/roles').then((m) => ({ index: buildIndex(m.ROLES), popular: m.POPULAR_TITLES })))

function useRoleIndex() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadIndex>> | null>(null)
  useEffect(() => {
    let live = true
    loadIndex().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}

// Role chooser used by onboarding and Profile. Typing searches titles and aliases
// ("Matching titles", top 8). Before typing, onboarding also shows "Popular titles", or
// "Related titles" from the same field once a role is chosen. Enter adds the highlighted
// match; otherwise the catalogue title if the text is exactly a title or alias ("swe"),
// otherwise exactly what was typed.
export default function RolePicker({
  id,
  roles,
  onChange,
  variant,
  onEmptyEnter,
}: {
  id: string
  roles: string[]
  onChange: (roles: string[]) => void
  variant: 'onboarding' | 'profile'
  // Enter on an empty box (onboarding uses it to continue).
  onEmptyEnter?: () => void
}) {
  const data = useRoleIndex()
  const [draft, setDraft] = useState('')
  // -1: nothing chosen with the arrows yet; -2: Esc pressed, so Enter keeps the typed text.
  const [active, setActive] = useState(-1)

  const taken = new Set(roles.map((r) => r.toLowerCase()))
  const typing = draft.trim().length > 0
  const matchRoles = typing && data ? searchRoles(data.index, draft, taken) : []
  const matches = matchRoles.map((r) => r.title)
  // When the text is clearly the start of the top match ("ux res" → UX researcher), it's
  // highlighted by default so Enter picks it rather than adding the half-typed words.
  const q = normalize(draft)
  const topIsPrefix = !!matchRoles[0] && [matchRoles[0].title, ...matchRoles[0].aliases].some((n) => normalize(n).startsWith(q))
  const current = active === -2 ? -1 : active >= 0 ? active : topIsPrefix ? 0 : -1
  const idle =
    variant === 'onboarding' && !typing && data
      ? (() => {
          const related = roles.length ? relatedTitles(data.index, roles) : null
          return related
            ? { label: 'Related titles', titles: related }
            : { label: 'Popular titles', titles: data.popular.filter((p) => !taken.has(p.toLowerCase())) }
        })()
      : null
  const shown = typing ? { label: 'Matching titles', titles: matches } : idle

  function add(title: string) {
    const t = title.trim().replace(/\s+/g, ' ')
    setDraft('')
    setActive(-1)
    if (!t || taken.has(t.toLowerCase())) return
    onChange([...roles, t])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && matches.length) {
      e.preventDefault()
      setActive(current < 0 ? 0 : (current + 1) % matches.length)
    } else if (e.key === 'ArrowUp' && matches.length) {
      e.preventDefault()
      setActive(current <= 0 ? matches.length - 1 : current - 1)
    } else if (e.key === 'Escape' && typing) {
      e.preventDefault()
      setActive(-2)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (current >= 0 && matches[current]) add(matches[current])
      else if (typing) add((data && exactRole(data.index, draft)?.title) || draft)
      else onEmptyEnter?.()
    } else if (e.key === 'Backspace' && !draft && roles.length) {
      onChange(roles.slice(0, -1))
    }
  }

  const listId = `${id}-suggestions`
  const chips = roles.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <RoleChip key={r} label={r} onRemove={() => onChange(roles.filter((x) => x !== r))} />
      ))}
    </div>
  )
  const input = (
    <Input
      id={id}
      icon={variant === 'onboarding' ? Search : Plus}
      inputSize={variant === 'onboarding' ? 'md' : 'sm'}
      placeholder={variant === 'onboarding' ? 'Type a job title and press Enter' : 'Add a role and press Enter'}
      value={draft}
      autoFocus={variant === 'onboarding'}
      autoComplete="off"
      role="combobox"
      aria-expanded={typing && matches.length > 0}
      aria-controls={listId}
      aria-activedescendant={current >= 0 ? `${listId}-${current}` : undefined}
      onChange={(e) => {
        setDraft(e.target.value)
        setActive(-1)
      }}
      onKeyDown={onKeyDown}
      hint={
        variant === 'onboarding'
          ? roles.length
            ? `${roles.length} added — press Enter on an empty field to continue`
            : 'Press Enter to add. You can change these any time.'
          : undefined
      }
    />
  )

  return (
    <div className={`flex flex-col ${variant === 'onboarding' ? 'gap-5' : 'gap-2.5'}`}>
      {/* Onboarding puts chosen roles under the box; Profile lists them above it. */}
      {variant === 'profile' && chips}
      {input}
      {variant === 'onboarding' && chips}
      {shown && shown.titles.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-semibold leading-[1.2] text-ink-500">{shown.label}</div>
          <div id={listId} role="listbox" aria-label={shown.label} className="flex flex-wrap gap-2">
            {shown.titles.map((t, i) => (
              <SuggestChip
                key={t}
                id={`${listId}-${i}`}
                label={t}
                active={typing && i === current}
                onAdd={() => add(t)}
              />
            ))}
          </div>
        </div>
      )}
      {typing && data && (
        <p className="text-[13px] text-ink-500">
          {!matches.length
            ? `No matching titles. Press Enter to add "${draft.trim()}".`
            : current >= 0
              ? `Enter adds "${matches[current]}". Press Esc to add "${draft.trim()}" as typed.`
              : `Press Enter to add "${draft.trim()}" as typed, or use ↑ ↓ to pick a title.`}
        </p>
      )}
    </div>
  )
}
