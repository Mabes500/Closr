import { fmtTime, isStale, jobDays, relDay } from '../lib/board'
import { ago, formatSalary } from '../lib/format'
import { whenDue, type ReminderWithApp } from '../lib/reminders'
import { STATUSES, type Application, type ApplicationStatus } from '../lib/types'
import { REM_META, isOverdue } from './RemChip'
import StageSelect from './StageSelect'
import { Card, CompanyTile } from './ui'

function NextIcon({ r }: { r: ReminderWithApp }) {
  const Icon = REM_META[r.type].icon
  return <Icon size={14} />
}

const th = 'whitespace-nowrap border-b border-paper-200 bg-paper-50 px-3.5 py-2.5 text-left text-xs font-semibold text-ink-500'
const td = 'px-3.5 py-2.5 group-hover:bg-paper-100 group-focus-visible:bg-paper-100'

// Table layout of the board (prototype `ListView`): furthest-along stages first,
// most recent first within a stage, Closed at the bottom.
export default function JobListView({
  apps,
  next,
  onOpen,
  onChangeStatus,
}: {
  apps: Application[]
  next: Map<string, ReminderWithApp>
  onOpen: (id: string) => void
  // The board's changeStatus, the same path as drag-and-drop.
  onChangeStatus: (id: string, status: ApplicationStatus) => void
}) {
  const order = (a: Application) => STATUSES.indexOf(a.status)
  const closedAt = STATUSES.indexOf('closed')
  const rows = [...apps].sort((a, b) =>
    order(a) === closedAt ? 1 : order(b) === closedAt ? -1 : order(b) - order(a) || jobDays(a) - jobDays(b),
  )

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              {['Role', 'Stage', 'Location', 'Salary', 'Applied', 'Next up'].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const r = next.get(a.id)
              const stale = isStale(a)
              return (
                <tr
                  key={a.id}
                  onClick={() => onOpen(a.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onOpen(a.id)}
                  tabIndex={0}
                  className={`group cursor-pointer outline-none ${i ? 'border-t border-paper-200' : ''} ${a.status === 'closed' ? 'opacity-70' : ''}`}
                >
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <CompanyTile name={a.company} size={28} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-[1.3] text-ink">{a.role}</div>
                        <div className="text-xs text-ink-500">{a.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <StageSelect app={a} onChange={onChangeStatus} />
                  </td>
                  <td className={`${td} text-ink-700`}>{a.location ?? '—'}</td>
                  <td className={`${td} whitespace-nowrap font-mono text-[13px] text-ink`}>{formatSalary(a)}</td>
                  <td className={`${td} whitespace-nowrap ${stale ? 'font-semibold text-gold-800' : 'text-ink-500'}`}>
                    {a.status === 'saved' && !a.applied_at ? '—' : ago(jobDays(a))}
                  </td>
                  <td className={`${td} whitespace-nowrap text-ink-700`}>
                    {r ? (
                      <span className={`inline-flex items-center gap-1.5 ${isOverdue(r) ? 'font-semibold text-coral-700' : ''}`}>
                        <NextIcon r={r} />
                        {relDay(whenDue(r))}, {fmtTime(whenDue(r))}
                      </span>
                    ) : (
                      <span className="text-ink-400">Nothing scheduled</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
