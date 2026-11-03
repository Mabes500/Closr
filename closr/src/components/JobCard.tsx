import { useState } from 'react'
import { Clock } from 'lucide-react'
import { isStale, jobDays } from '../lib/board'
import { ago, formatSalary } from '../lib/format'
import type { ReminderWithApp } from '../lib/reminders'
import { CLOSE_REASON_LABEL, VISA_LABEL, WORK_MODE_LABEL, type Application, type ApplicationStatus } from '../lib/types'
import RemChip from './RemChip'
import StageSelect from './StageSelect'
import { Badge, CompanyTile } from './ui'

// Mode, visa and (for remote jobs) time zone tags (prototype `JobTags` + `VisaBadge`).
export function JobTags({ app }: { app: Application }) {
  const visa =
    app.visa_sponsorship === 'yes'
      ? { className: 'bg-mint-100 text-mint-700', label: VISA_LABEL.yes }
      : app.visa_sponsorship === 'no'
        ? { className: 'bg-coral-100 text-coral-700', label: VISA_LABEL.no }
        : app.visa_sponsorship === 'unknown'
          ? { className: undefined, label: 'Visa: unknown' }
          : null
  if (!app.work_mode && !visa && !app.time_zone) return null
  return (
    <div className="flex flex-wrap gap-[5px]">
      {app.work_mode && <Badge>{WORK_MODE_LABEL[app.work_mode]}</Badge>}
      {visa && <Badge className={visa.className}>{visa.label}</Badge>}
      {app.work_mode === 'remote' && app.time_zone && <Badge>{app.time_zone}</Badge>}
    </div>
  )
}

// Board card (prototype `JobCard`). Closed cards are dimmed and show their reason.
export default function JobCard({
  app,
  nextRem,
  postingClosed,
  onOpen,
  onChangeStatus,
}: {
  app: Application
  // Saved from the jobs feed, and the employer has since taken the posting down.
  postingClosed?: boolean
  // The job's next open reminder (prototype RemChip on the card).
  nextRem?: ReminderWithApp
  onOpen: () => void
  // The board's changeStatus, the same path as drag-and-drop.
  onChangeStatus: (id: string, status: ApplicationStatus) => void
}) {
  // While the stage menu is open the card isn't draggable, so picking can't start a drag.
  const [picking, setPicking] = useState(false)
  const closed = app.status === 'closed'
  const days = jobDays(app)
  const foot =
    app.status === 'saved'
      ? `Saved ${ago(days)}`
      : closed
        ? app.close_reason
          ? CLOSE_REASON_LABEL[app.close_reason]
          : 'Closed'
        : isStale(app)
          ? null
          : `Applied ${ago(days)}`
  const where = [app.company, app.location].filter(Boolean).join(' · ')

  return (
    <div
      draggable={!picking}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer flex-col gap-2.5 rounded-2xl border border-paper-200 bg-white p-3.5 shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-paper-300 hover:shadow-card-hover focus-visible:shadow-[0_0_0_3px_var(--color-focus)] focus-visible:outline-none ${
        closed ? 'opacity-[.72]' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <CompanyTile name={app.company} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold leading-[1.3] text-ink">{app.role}</span>
          <span className="text-[13px] leading-[1.3] text-ink-500">{where}</span>
        </div>
      </div>
      {/* Stage menu at the end of the tags row, so the title keeps the card's full width. */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <JobTags app={app} />
        </div>
        <StageSelect app={app} onChange={onChangeStatus} onPicking={setPicking} />
      </div>
      {nextRem && <RemChip r={nextRem} compact />}
      {postingClosed && app.status === 'saved' &&<span className="text-xs font-medium text-coral-700">This posting has closed</span>}
      <div className="flex items-center gap-2 text-xs leading-none text-ink-500">
        {foot ? (
          <span>{foot}</span>
        ) : (
          <span className="flex items-center gap-1 font-semibold text-gold-800">
            <Clock size={13} />
            No reply · {days}d
          </span>
        )}
        <span className="ml-auto font-mono text-ink">{formatSalary(app)}</span>
      </div>
    </div>
  )
}
