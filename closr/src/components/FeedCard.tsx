import { useState } from 'react'
import { Check, Undo2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { STAGE_BADGE } from '../lib/board'
import { daysAgo, ago, formatSalary } from '../lib/format'
import { DISMISS_REASONS, SOURCE_NAME, annualSalary, postedOn, useTakeMatch, useUpdateMatch, type MatchWithPosting } from '../lib/jobs'
import { STATUS_LABEL, WORK_MODE_LABEL, type Application, type JobPosting } from '../lib/types'
import { Badge, Button, Card, CompanyTile } from './ui'

const PER: Record<string, string> = { hour: '/hr', day: '/day', week: '/wk', month: '/mo' }

// "£80–95k", "$45–60/hr", or nothing when the posting doesn't say.
export function postingSalary(p: JobPosting) {
  if (!p.salary_period || !p.salary_currency || (p.salary_min == null && p.salary_max == null)) return null
  if (p.salary_period === 'year') return formatSalary(annualSalary(p))
  const n = (x: number | null) => (x == null ? '' : Number(x).toLocaleString(undefined, { maximumFractionDigits: 0 }))
  const range = p.salary_min != null && p.salary_max != null && p.salary_min !== p.salary_max ? `${n(p.salary_min)}–${n(p.salary_max)}` : n(p.salary_max ?? p.salary_min)
  return `${p.salary_currency} ${range}${PER[p.salary_period] ?? ''}`
}

// Work mode and visa tags (prototype JobTags on a posting).
export function PostingTags({ p }: { p: JobPosting }) {
  return (
    <div className="flex flex-wrap gap-[5px]">
      {p.work_mode && <Badge>{WORK_MODE_LABEL[p.work_mode]}</Badge>}
      {p.visa_sponsorship === 'yes' && <Badge className="bg-mint-100 text-mint-700">Sponsors visa</Badge>}
      {p.visa_sponsorship === 'no' && <Badge className="bg-coral-100 text-coral-700">No visa sponsorship</Badge>}
      {p.timezone_note && <Badge>{p.timezone_note}</Badge>}
    </div>
  )
}

export function Reasons({ reasons, className = '' }: { reasons: string[]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-1 ${className}`}>
      {reasons.map((r) => (
        <li key={r} className="flex items-center gap-1.5 text-[13px] font-medium text-ink-700">
          <Check size={14} className="shrink-0 text-mint-600" />
          {r}
        </li>
      ))}
    </ul>
  )
}

// One match on the Jobs screen (prototype `FeedCard`). `app` is the board job it was saved as.
export default function FeedCard({ m, app }: { m: MatchWithPosting; app: Application | undefined }) {
  const navigate = useNavigate()
  const take = useTakeMatch()
  const update = useUpdateMatch()
  // Just dismissed here: show the optional reason and Undo instead of the card.
  const [hidden, setHidden] = useState(false)
  const p = m.posting
  const pay = postingSalary(p)
  const href = `/jobs/${p.id}`

  if (m.status === 'dismissed' && hidden)
    return (
      <Card sunken className="flex flex-wrap items-center gap-2 px-4 py-3 text-[13px] text-ink-700">
        <span className="font-medium">
          Hidden: {p.title} at {p.company}.
        </span>
        <span className="text-ink-500">Why? (optional)</span>
        {DISMISS_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={m.dismiss_reason === r}
            onClick={() => update.mutate({ id: m.id, dismiss_reason: m.dismiss_reason === r ? null : r })}
            className={`h-7 rounded-full border-[1.5px] px-2.5 text-xs font-medium ${m.dismiss_reason === r ? 'border-action bg-action text-on-action' : 'border-paper-300 bg-surface text-ink-700 hover:border-ink-300'}`}
          >
            {r}
          </button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          icon={Undo2}
          className="ml-auto"
          onClick={() => {
            update.mutate({ id: m.id, status: 'new', dismiss_reason: null })
            setHidden(false)
          }}
        >
          Undo
        </Button>
      </Card>
    )

  return (
    <Card className={`p-5 ${m.status === 'saved' ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-start gap-4">
        <CompanyTile name={p.company} size={44} />
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
          <div>
            <Link to={href} className="text-base font-semibold leading-[1.3] text-ink hover:underline">
              {p.title}
            </Link>
            <div className="text-[13px] text-ink-500">{[p.company, p.location].filter(Boolean).join(' · ')}</div>
          </div>
          <PostingTags p={p} />
          <Reasons reasons={m.reasons} />
          <div className="text-xs text-ink-500">
            via {SOURCE_NAME[p.source]} · posted {ago(daysAgo(postedOn(p)))} ·{' '}
            <Link to={href} className="font-semibold text-blue-600 hover:underline">
              View posting
            </Link>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
          {pay && <span className="font-mono text-[15px] font-medium text-ink">{pay}</span>}
          {m.status === 'saved' ? (
            app ? (
              <button type="button" onClick={() => navigate('/', { state: { open: app.id } })} className="hover:brightness-95">
                <Badge className={STAGE_BADGE[app.status].badge} dot={STAGE_BADGE[app.status].dot}>
                  {app.status === 'saved' ? 'Saved to board' : `In ${STATUS_LABEL[app.status]}`}
                </Badge>
              </button>
            ) : (
              <Badge>Saved to board</Badge>
            )
          ) : (
            <>
              <div className="flex gap-1.5">
                <Button size="sm" disabled={take.isPending} onClick={() => take.mutate({ posting: p, matchId: m.id, applied: false })}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" disabled={take.isPending} onClick={() => take.mutate({ posting: p, matchId: m.id, applied: true })}>
                  I applied
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  update.mutate({ id: m.id, status: 'dismissed' })
                  setHidden(true)
                }}
              >
                Not for me
              </Button>
            </>
          )}
          {take.error && <span className="max-w-[220px] text-right text-xs text-coral-700">{take.error.message}</span>}
        </div>
      </div>
    </Card>
  )
}
