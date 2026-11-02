import { useEffect, useState, type DragEvent } from 'react'
import { Briefcase, FileSpreadsheet, Link as LinkIcon, Plus, Search, Send, Upload } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApplications, useMoveApplication, useUpdateApplication } from '../lib/applications'
import { isStale, nextReminders } from '../lib/board'
import { plusDays, useReminders } from '../lib/reminders'
import { useProfile } from '../lib/profile'
import { STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from '../lib/types'
import AddJobModal from '../components/AddJobModal'
import ApplicationDrawer from '../components/ApplicationDrawer'
import ChannelModal from '../components/ChannelModal'
import JobCard from '../components/JobCard'
import JobListView from '../components/JobListView'
import { Mark } from '../components/Logo'
import ReasonModal from '../components/ReasonModal'
import ScheduleDialog, { type ScheduleInit } from '../components/ScheduleDialog'
import { Button, Card, EmptyState, FilterChip, Input, Tabs, Toast, TopBar } from '../components/ui'

type Layout = 'board' | 'list'
type Filter = 'all' | 'remote' | 'hybrid' | 'onsite' | 'visa' | 'stale'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'visa', label: 'Sponsors visa' },
  { value: 'stale', label: 'Stale' },
]

// Hint shown in an empty column, and in the faded preview columns of an empty board.
const EMPTY_HINT: Record<ApplicationStatus, string> = {
  saved: 'Roles you want to apply to',
  applied: 'Sent applications',
  interviewing: 'Interviews in progress',
  offer: 'Offers land here',
  closed: 'Rejections and withdrawals',
}

// Board or list is a per-device preference, like the prototype's layout setting.
const LAYOUT_KEY = 'closr-board-layout'
function loadLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'board'
  } catch {
    return 'board'
  }
}

const matches = (a: Application, f: Filter) =>
  f === 'all' ||
  (f === 'visa' ? a.visa_sponsorship === 'yes' : f === 'stale' ? isStale(a) : a.work_mode === f)

// Prototype `BoardScreen`: kanban or list, with filter chips and search.
export default function Board() {
  const navigate = useNavigate()
  const { data: apps = [], isLoading, error } = useApplications()
  const { data: reminders = [] } = useReminders()
  const move = useMoveApplication()
  const update = useUpdateApplication()
  const [layout, setLayoutState] = useState<Layout>(loadLayout)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  // Onboarding's "Add my first job" arrives with state { add: 'link' } (the modal opens on Paste link).
  const location = useLocation()
  const [adding, setAdding] = useState(() => (location.state as { add?: string } | null)?.add === 'link')
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)
  // Schedule's "Open job" and notifications arrive with state { open: id }, also while
  // the board is already showing.
  const [openId, setOpenId] = useState<string | null>(null)
  const openFromLink = (location.state as { open?: string } | null)?.open
  useEffect(() => {
    if (openFromLink) setOpenId(openFromLink)
  }, [openFromLink, location.key])
  const [closing, setClosing] = useState<Application | null>(null)
  const [asking, setAsking] = useState<Application | null>(null)
  const [offer, setOffer] = useState<Pick<Application, 'id' | 'company'> | null>(null)
  const [scheduling, setScheduling] = useState<ScheduleInit | null>(null)
  const { data: profile } = useProfile()
  const openApp = apps.find((a) => a.id === openId)
  const next = nextReminders(reminders)

  // Marked Applied → offer a follow-up a week out, unless turned off in Profile or one exists.
  const offerFollowUp = (app: Pick<Application, 'id' | 'company'>) => {
    if (profile?.suggest_follow_ups === false) return
    if (reminders.some((r) => r.application_id === app.id && r.type === 'follow' && !r.done)) return
    setOffer(app)
  }

  const setLayout = (l: Layout) => {
    setLayoutState(l)
    try {
      localStorage.setItem(LAYOUT_KEY, l)
    } catch {
      // Storage unavailable (private window): the choice just isn't remembered.
    }
  }

  // The one path for stage changes (drag, card/list chip, drawer tabs).
  // Moving to Closed asks for a reason first; cancelling leaves the card where it was.
  // Moving to Interviewing asks what got you the interview (skippable), once per job.
  // Moving to Applied offers a follow-up reminder.
  const changeStatus = (id: string, status: ApplicationStatus) => {
    const app = apps.find((a) => a.id === id)
    if (!app || app.status === status) return
    if (status === 'closed') return setClosing(app)
    move(id, status)
    if (status === 'interviewing' && !app.interview_origin) setAsking(app)
    if (status === 'applied') offerFollowUp(app)
  }

  const onDrop = (status: ApplicationStatus) => (e: DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    changeStatus(e.dataTransfer.getData('text/plain'), status)
  }

  const query = q.trim().toLowerCase()
  const list = apps.filter(
    (a) => matches(a, filter) && (!query || [a.role, a.company, a.location].join(' ').toLowerCase().includes(query)),
  )
  const applied = apps.filter((a) => a.status !== 'saved').length
  const empty = !isLoading && apps.length === 0

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[18px]">
      <TopBar
        title="Board"
        sub={
          empty ? undefined : (
            <span className="font-mono text-[13px]">
              {apps.length} jobs · {applied} applied
            </span>
          )
        }
      >
        <Button variant="secondary" icon={Upload} onClick={() => navigate('/import')}>
          Import sheet
        </Button>
        <Button icon={Plus} onClick={() => setAdding(true)}>
          Add job
        </Button>
      </TopBar>

      {error && <p className="text-sm text-coral-700">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : empty ? (
        <>
          <Card>
            <EmptyState
              art={<Mark size={52} />}
              title="Your board is ready for its first job"
              body="Add a role you've applied to or have your eye on. Closr tracks the stage, reminds you to follow up, and keeps notes in one place."
            >
              <Button icon={LinkIcon} onClick={() => setAdding(true)}>
                Paste a job link
              </Button>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={() => navigate('/import')}>
                Import a spreadsheet
              </Button>
              <Button variant="ghost" icon={Briefcase} onClick={() => navigate('/jobs')}>
                Browse matches
              </Button>
            </EmptyState>
          </Card>
          <div aria-hidden="true" className="grid auto-cols-[minmax(170px,1fr)] grid-flow-col gap-3 overflow-x-auto opacity-70">
            {STATUSES.map((s) => (
              <section key={s} className="flex min-h-40 flex-col gap-2 rounded-2xl bg-paper-100 p-2.5">
                <ColumnHeader status={s} count={0} />
                <div className="rounded-xl border-[1.5px] border-dashed border-paper-400 px-2 py-3.5 text-center text-[13px] text-ink-500">
                  {EMPTY_HINT[s]}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              variant="pill"
              value={layout}
              onChange={setLayout}
              items={[
                { value: 'board', label: 'Board' },
                { value: 'list', label: 'List' },
              ]}
            />
            <span className="mx-1 h-[22px] w-px bg-paper-200" />
            {FILTERS.map((f) => (
              <FilterChip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </FilterChip>
            ))}
            <Input
              id="board-search"
              icon={Search}
              inputSize="sm"
              type="search"
              placeholder="Search jobs"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              wrapClassName="ml-auto w-[220px] max-w-full"
            />
          </div>

          {list.length === 0 ? (
            <Card sunken>
              <EmptyState
                compact
                icon={Search}
                tone="paper"
                title={q ? `No jobs match "${q}"` : 'No jobs match this filter'}
                body="Try a different filter or search term. Closed jobs are included in search."
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilter('all')
                    setQ('')
                  }}
                >
                  Clear filters
                </Button>
              </EmptyState>
            </Card>
          ) : layout === 'list' ? (
            <JobListView apps={list} next={next} onOpen={setOpenId} onChangeStatus={changeStatus} />
          ) : (
            <div className="grid flex-1 auto-cols-[minmax(250px,1fr)] grid-flow-col items-start gap-3 overflow-x-auto pb-2">
              {STATUSES.map((s) => {
                const cards = list.filter((a) => a.status === s)
                return (
                  <section
                    key={s}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(s)
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={onDrop(s)}
                    className={`flex min-h-[420px] flex-col gap-2 rounded-2xl p-2.5 transition-colors ${
                      dragOver === s ? 'bg-blue-50 shadow-[inset_0_0_0_2px_var(--color-blue-400)]' : 'bg-paper-100'
                    }`}
                  >
                    <ColumnHeader status={s} count={cards.length} />
                    {cards.map((a) => (
                      <JobCard
                        key={a.id}
                        app={a}
                        nextRem={next.get(a.id)}
                        onOpen={() => setOpenId(a.id)}
                        onChangeStatus={changeStatus}
                      />
                    ))}
                    {!cards.length && (
                      <div className="rounded-xl border-[1.5px] border-dashed border-paper-400 px-2 py-3.5 text-center text-[13px] text-ink-500">
                        {s === 'offer' ? 'Offers land here' : 'Drag a job here'}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {adding && (
        <AddJobModal
          onClose={() => {
            setAdding(false)
            // Drop onboarding's { add: 'link' } so a reload doesn't reopen the modal.
            if (location.state) navigate(location.pathname, { replace: true, state: null })
          }}
          onAdded={(app) => app.status === 'applied' && offerFollowUp(app)}
        />
      )}
      {openApp && (
        <ApplicationDrawer
          app={openApp}
          onClose={() => {
            setOpenId(null)
            if (location.state) navigate(location.pathname, { replace: true, state: null })
          }}
          onChangeStatus={changeStatus}
          escapeEnabled={!closing && !asking && !scheduling}
        />
      )}
      {offer && (
        <Toast
          icon={Send}
          title={`${offer.company} moved to Applied.`}
          message={`Set a follow-up for ${plusDays(7).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}?`}
          action={{
            label: 'Set follow-up',
            onClick: () => {
              setScheduling({ type: 'follow', application_id: offer.id, due_at: plusDays(7).toISOString() })
              setOffer(null)
            },
          }}
          onClose={() => setOffer(null)}
        />
      )}
      {scheduling && <ScheduleDialog init={scheduling} onClose={() => setScheduling(null)} />}
      {asking && (
        <ChannelModal
          app={asking}
          onPick={(origin) => {
            update.mutate({ id: asking.id, interview_origin: origin })
            setAsking(null)
          }}
          onClose={() => setAsking(null)}
        />
      )}
      {closing && (
        <ReasonModal
          app={closing}
          onPick={(reason) => {
            move(closing.id, 'closed', reason)
            setClosing(null)
          }}
          onClose={() => setClosing(null)}
        />
      )}
    </div>
  )
}

function ColumnHeader({ status, count }: { status: ApplicationStatus; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-1.5 pt-1">
      <span className="size-2 rounded-full" style={{ background: `var(--color-status-${status})` }} />
      <h2 className="text-[15px] font-semibold leading-none tracking-[-0.01em] text-ink">{STATUS_LABEL[status]}</h2>
      <span className="font-mono text-xs leading-none text-ink-500">{count}</span>
    </div>
  )
}
