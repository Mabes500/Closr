import { whenDue, type ReminderWithApp } from '../lib/reminders'
import { FORMAT_LABEL, OUTCOME_LABEL, type InterviewOutcome } from '../lib/types'

const OUTCOME_CLASS: Record<InterviewOutcome, string> = {
  pending: 'bg-spark-soft text-ink',
  passed: 'bg-status-offer/10 text-status-offer',
  failed: 'bg-status-rejected/10 text-status-rejected',
  cancelled: 'bg-canvas text-ink-faint',
}

// One interview reminder as a clickable row (temporary Interviews page, until Schedule). `showCompany` is off inside the drawer,
// where the application is already obvious.
export default function InterviewRow({
  interview: i,
  showCompany = true,
  onClick,
}: {
  interview: ReminderWithApp
  showCompany?: boolean
  onClick: () => void
}) {
  const when = new Date(whenDue(i))
  const outcome = i.interview_outcome ?? 'pending'
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-line bg-surface p-3 text-left shadow-sm hover:border-line-strong"
    >
      <div className="w-20 shrink-0 font-mono text-xs leading-5">
        <p className="text-ink">{when.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        <p className="text-ink-faint">{when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{i.title}</p>
        {showCompany && i.application && (
          <p className="truncate text-sm text-ink-muted">
            {i.application.company} · {i.application.role}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          {i.interview_format && <span className="rounded bg-canvas px-1.5 py-0.5">{FORMAT_LABEL[i.interview_format]}</span>}
          {i.interviewer && <span className="truncate">with {i.interviewer}</span>}
        </div>
      </div>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${OUTCOME_CLASS[outcome]}`}>{OUTCOME_LABEL[outcome]}</span>
    </button>
  )
}
