import { useState } from 'react'
import { Calendar, CalendarCheck, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ChannelModal from '../components/ChannelModal'
import { Mark } from '../components/Logo'
import ScheduleDialog, { type ScheduleInit } from '../components/ScheduleDialog'
import { Button, Card, CompanyTile, EmptyState, Toast, TopBar } from '../components/ui'
import { useApplications, useMoveApplication, useUpdateApplication } from '../lib/applications'
import { useCheckins, CHECKIN_DAYS } from '../lib/checkins'
import { useProfile } from '../lib/profile'
import { plusDays, useReminders } from '../lib/reminders'
import type { Application } from '../lib/types'

// "No reply yet" offers a follow-up this many days out (prototype Schedule side card).
const FOLLOW_UP_IN = 3

// Prototype `CheckinsScreen`: one card per job quiet in Applied for 7+ days, with
// one-tap answers that keep the board honest.
export default function Checkins() {
  const navigate = useNavigate()
  const due = useCheckins()
  const { data: apps = [] } = useApplications()
  const { data: reminders = [] } = useReminders()
  const { data: profile } = useProfile()
  const move = useMoveApplication()
  const update = useUpdateApplication()
  // Answered this visit, for "2 of 5 done".
  const [answered, setAnswered] = useState<string[]>([])
  const [asking, setAsking] = useState<Application | null>(null)
  const [offer, setOffer] = useState<Application | null>(null)
  const [scheduling, setScheduling] = useState<ScheduleInit | null>(null)

  if (!due) return null

  const done = answered.filter((id) => !due.some((c) => c.app.id === id)).length
  const total = due.length + done
  const hasApplied = apps.some((a) => a.status !== 'saved')

  const answer = (app: Application, a: 'none' | 'interview' | 'rejected') => {
    setAnswered((ids) => [...ids, app.id])
    if (a === 'rejected') return move(app.id, 'closed', 'rejected')
    if (a === 'interview') {
      // Same as moving it on the board: ask what got you the interview, once per job.
      move(app.id, 'interviewing')
      if (!app.interview_origin) setAsking(app)
      return
    }
    // No reply yet: ask again in 7 days, and offer a follow-up unless turned off or one is already set.
    update.mutate({ id: app.id, checked_in_at: new Date().toISOString() })
    const hasFollowUp = reminders.some((r) => r.application_id === app.id && r.type === 'follow' && !r.done)
    if (profile?.suggest_follow_ups !== false && !hasFollowUp) setOffer(app)
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <TopBar
        title="Check-ins"
        sub={
          due.length ? (
            <span className="font-mono text-[13px]">
              {done} of {total} done
            </span>
          ) : undefined
        }
      />

      {due.length ? (
        <div className="flex max-w-[680px] flex-col gap-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-200" role="progressbar" aria-valuenow={done} aria-valuemax={total}>
            <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
          {due.map(({ app, days }) => (
            <Card key={app.id} className="flex flex-col gap-3.5 p-5">
              <div className="flex items-start gap-3">
                <CompanyTile name={app.company} size={36} />
                <div>
                  <div className="text-[15px] font-medium leading-[1.4] text-ink">
                    Applied to <b className="font-semibold">{app.company}</b> {days} days ago. Heard back?
                  </div>
                  <div className="text-[13px] text-ink-500">{[app.role, app.location].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
                <Button variant="secondary" onClick={() => answer(app, 'none')}>
                  No reply yet
                </Button>
                <Button variant="secondary" icon={Calendar} onClick={() => answer(app, 'interview')} className="!border-gold-100 !bg-gold-100 !text-gold-800">
                  Interview
                </Button>
                <Button variant="secondary" onClick={() => answer(app, 'rejected')}>
                  Rejected
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-[640px]">
          {hasApplied ? (
            <EmptyState
              art={<Mark size={52} />}
              title="Your board is up to date"
              body={`We'll ask again when an application has been quiet for ${CHECKIN_DAYS} days.`}
            >
              <Button onClick={() => navigate('/')}>Back to board</Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No check-ins yet"
              body={`Once an application has been quiet for ${CHECKIN_DAYS} days, we'll ask how it's going here. One tap keeps your board honest.`}
            >
              <Button onClick={() => navigate('/', { state: { add: 'link' } })}>Add a job you applied to</Button>
            </EmptyState>
          )}
        </Card>
      )}

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
      {offer && (
        <Toast
          icon={Send}
          title={`No reply from ${offer.company} yet.`}
          message={`Set a follow-up for ${plusDays(FOLLOW_UP_IN).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}?`}
          action={{
            label: 'Set follow-up',
            onClick: () => {
              setScheduling({ type: 'follow', application_id: offer.id, due_at: plusDays(FOLLOW_UP_IN).toISOString() })
              setOffer(null)
            },
          }}
          onClose={() => setOffer(null)}
        />
      )}
      {scheduling && <ScheduleDialog init={scheduling} onClose={() => setScheduling(null)} />}
    </div>
  )
}
