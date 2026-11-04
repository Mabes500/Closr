import { useState } from 'react'
import { ChevronDown, ChevronRight, CircleCheck, Link as LinkIcon, Pencil, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FeedCard from '../components/FeedCard'
import { Badge, Button, Card, EmptyState, FilterChip, TopBar } from '../components/ui'
import { useApplications } from '../lib/applications'
import { countryName } from '../lib/countries'
import { daysAgo } from '../lib/format'
import { latestDay, postedOn, useMatches, type MatchWithPosting } from '../lib/jobs'
import { useProfile } from '../lib/profile'
import { WORK_MODE_LABEL } from '../lib/types'

type Filter = 'all' | 'remote' | 'visa' | 'today'
const FILTERS: { value: Filter; label: string; test: (m: MatchWithPosting) => boolean }[] = [
  { value: 'all', label: 'All matches', test: () => true },
  { value: 'remote', label: 'Remote', test: (m) => m.posting.work_mode === 'remote' },
  { value: 'visa', label: 'Sponsors visa', test: (m) => m.posting.visa_sponsorship === 'yes' },
  { value: 'today', label: 'Posted today', test: (m) => daysAgo(postedOn(m.posting)) <= 0 },
]

// Prototype `JobsScreen`: today's matches from public job boards, with filters.
export default function Jobs() {
  const navigate = useNavigate()
  const { data: matches, isLoading, error } = useMatches()
  const { data: profile } = useProfile()
  const { data: apps = [] } = useApplications()
  const [filter, setFilter] = useState<Filter>('all')
  const [showEarlier, setShowEarlier] = useState(false)

  const all = matches ?? []
  const day = latestDay(all)
  // Today's batch, without ones dismissed on an earlier visit (just-dismissed cards keep their Undo).
  const todays = all.filter((m) => m.match_date === day)
  const [seenIds] = useState(() => new Set<string>())
  for (const m of todays) if (m.status !== 'dismissed') seenIds.add(m.id)
  const visible = todays.filter((m) => m.status !== 'dismissed' || seenIds.has(m.id))
  const test = FILTERS.find((f) => f.value === filter)!.test
  const shown = visible.filter(test)
  const earlier = all.filter((m) => m.match_date !== day && m.status === 'new')
  const appFor = (postingId: string) => apps.find((a) => a.job_posting_id === postingId)

  const roles = profile?.target_roles ?? []
  const chips = [
    roles.length ? roles.join(', ') : null,
    profile?.work_countries.length ? profile.work_countries.map(countryName).join(', ') : null,
    profile?.work_setups.length ? profile.work_setups.map((s) => WORK_MODE_LABEL[s]).join(' or ') : null,
    profile?.needs_visa_sponsorship ? 'Needs sponsorship' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="flex max-w-[980px] flex-col gap-[18px]">
      <TopBar title="Jobs" sub="Today's matches, from employers' own job boards" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500">Matching on</span>
        {chips.length ? (
          chips.map((c) => (
            <Badge key={c} className="bg-oxford-50 text-brand-ink">
              {c}
            </Badge>
          ))
        ) : (
          <span className="text-[13px] text-ink-500">nothing yet</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          Edit
        </Button>
      </div>

      {error && <p className="text-sm text-coral-700">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : !all.length ? (
        <Card>
          {roles.length ? (
            <EmptyState
              icon={Sparkles}
              title="Finding your first matches"
              body={`We check employers' job boards every morning for ${roles.join(', ').toLowerCase()} roles. Your first matches arrive within 24 hours.`}
            >
              <Button variant="secondary" icon={Pencil} onClick={() => navigate('/profile')}>
                Refine what you're looking for
              </Button>
              <Button variant="ghost" icon={LinkIcon} onClick={() => navigate('/', { state: { add: 'link' } })}>
                Add a job you found
              </Button>
            </EmptyState>
          ) : (
            <EmptyState icon={Sparkles} title="Tell us what you're looking for" body="Add the roles you want in your profile, and matches start arriving the next morning.">
              <Button icon={Pencil} onClick={() => navigate('/profile')}>
                Add target roles
              </Button>
            </EmptyState>
          )}
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <FilterChip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </FilterChip>
            ))}
            <span className="ml-auto font-mono text-xs text-ink-500">
              {todays.length} match{todays.length === 1 ? '' : 'es'} {day && daysAgo(day) <= 0 ? 'today' : 'in the latest batch'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {shown.map((m) => (
              <FeedCard key={m.id} m={m} app={appFor(m.posting_id)} />
            ))}
            {!shown.length && (
              <Card sunken>
                {todays.every((m) => m.status !== 'new') ? (
                  <EmptyState compact icon={CircleCheck} title="You've been through today's matches" body="New matches arrive tomorrow morning. Saved ones are on your board.">
                    <Button size="sm" variant="secondary" onClick={() => navigate('/')}>
                      Go to board
                    </Button>
                  </EmptyState>
                ) : (
                  <EmptyState compact icon={Search} tone="paper" title="No matches for this filter today" body="Switch back to all matches, or loosen what you're looking for in your profile.">
                    <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                      Show all matches
                    </Button>
                  </EmptyState>
                )}
              </Card>
            )}
          </div>
          {earlier.length > 0 && (
            <div>
              <Button variant="ghost" size="sm" icon={showEarlier ? ChevronDown : ChevronRight} onClick={() => setShowEarlier(!showEarlier)}>
                Earlier matches you haven't looked at ({earlier.length})
              </Button>
              {showEarlier && (
                <div className="mt-2 flex flex-col gap-3">
                  {earlier.map((m) => (
                    <FeedCard key={m.id} m={m} app={appFor(m.posting_id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
