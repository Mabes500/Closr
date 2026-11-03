import { ArrowLeft, ArrowRight, Bookmark, Check, ExternalLink, Info } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PostingTags, Reasons, postingSalary } from '../components/FeedCard'
import { Badge, Button, Card, CompanyTile, EmptyState } from '../components/ui'
import { useApplications } from '../lib/applications'
import { STAGE_BADGE } from '../lib/board'
import { ago, daysAgo } from '../lib/format'
import { SOURCE_NAME, postedOn, usePosting, useTakeMatch, useUpdateMatch } from '../lib/jobs'
import { STATUS_LABEL } from '../lib/types'

// Prototype `PostingPage`: the posting's details, why it matches, and what to do with it.
// "Apply on company site" always goes to the employer's own posting.
export default function Posting() {
  const { postingId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = usePosting(postingId)
  const { data: apps = [] } = useApplications()
  const take = useTakeMatch()
  const update = useUpdateMatch()

  const back = (
    <Link to="/jobs" className="-ml-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg py-1.5 pl-0.5 pr-2 text-sm font-semibold text-ink-500 hover:bg-paper-100 hover:text-ink">
      <ArrowLeft size={16} />
      Jobs
    </Link>
  )
  if (isLoading) return null
  if (error || !data)
    return (
      <div className="flex max-w-[1060px] flex-col gap-5">
        {back}
        <Card>
          <EmptyState icon={Info} tone="paper" title="This posting isn't available" body={error?.message ?? 'It may have been removed from the employer’s job board.'} />
        </Card>
      </div>
    )

  const { posting: p, match } = data
  const app = apps.find((a) => a.job_posting_id === p.id)
  const pay = postingSalary(p)
  const closed = !!p.closed_at
  const saved = !!app || match?.status === 'saved'

  return (
    <div className="flex max-w-[1060px] flex-col gap-5">
      {back}
      <div className="flex flex-wrap items-start gap-4">
        <CompanyTile name={p.company} size={56} />
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">{p.title}</h1>
          <div className="text-[15px] text-ink-500">
            <span className="font-semibold text-ink">{p.company}</span>
            {p.location ? ` · ${p.location}` : ''} · via {SOURCE_NAME[p.source]} · posted {ago(daysAgo(postedOn(p)))}
          </div>
          <div className="mt-1">
            <PostingTags p={p} />
          </div>
        </div>
      </div>

      {closed && (
        <div className="flex items-center gap-2.5 rounded-xl bg-coral-100 px-4 py-3 text-sm font-medium text-coral-700">
          <Info size={16} className="shrink-0" />
          This posting has closed. The employer no longer lists it.
        </div>
      )}

      <div className="grid items-start gap-5 min-[861px]:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6">
          <h2 className="mb-3 text-[15px] font-semibold text-ink">About the role</h2>
          {p.description ? (
            <div className="max-w-[680px] whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{p.description}</div>
          ) : (
            <p className="text-sm text-ink-500">The employer didn't publish a description. Open the posting on their site for details.</p>
          )}
        </Card>

        <div className="flex flex-col gap-4 min-[861px]:sticky min-[861px]:top-6">
          <Card className="flex flex-col gap-3.5 p-6">
            {pay && <div className="font-mono text-[22px] font-medium text-ink">{pay}</div>}
            {saved ? (
              <>
                {app ? (
                  <Badge className={STAGE_BADGE[app.status].badge} dot={STAGE_BADGE[app.status].dot}>
                    {app.status === 'saved' ? 'Saved to board' : `In ${STATUS_LABEL[app.status]}`}
                  </Badge>
                ) : (
                  <Badge>Saved to board</Badge>
                )}
                {app && (
                  <Button variant="secondary" iconRight={ArrowRight} onClick={() => navigate('/', { state: { open: app.id } })}>
                    Open in board
                  </Button>
                )}
              </>
            ) : match?.status === 'dismissed' ? (
              <>
                <Badge>Hidden from your matches</Badge>
                <Button variant="secondary" onClick={() => update.mutate({ id: match.id, status: 'new', dismiss_reason: null })}>
                  Show it again
                </Button>
              </>
            ) : (
              <>
                <Button icon={Bookmark} disabled={take.isPending || closed} onClick={() => take.mutate({ posting: p, matchId: match?.id ?? null, applied: false })}>
                  Save to board
                </Button>
                <Button variant="secondary" icon={Check} disabled={take.isPending || closed} onClick={() => take.mutate({ posting: p, matchId: match?.id ?? null, applied: true })}>
                  I applied
                </Button>
                {match && (
                  <Button variant="ghost" onClick={() => update.mutate({ id: match.id, status: 'dismissed' }, { onSuccess: () => navigate('/jobs') })}>
                    Not for me
                  </Button>
                )}
              </>
            )}
            {take.error && <p className="text-xs text-coral-700">{take.error.message}</p>}
            {!closed && (
              <a
                href={p.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Apply on company site
                <ExternalLink size={14} />
              </a>
            )}
          </Card>
          {match && match.reasons.length > 0 && (
            <Card className="border-gold-100 bg-gold-100/50 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-gold-800">Why it matches</div>
              <Reasons reasons={match.reasons} className="mt-2.5" />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
