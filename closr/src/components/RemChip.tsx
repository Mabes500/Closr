import { AlarmClock, Bell, Calendar, Send, type LucideIcon } from 'lucide-react'
import { relDay, fmtTime } from '../lib/board'
import { daysAgo } from '../lib/format'
import { whenDue } from '../lib/reminders'
import type { Reminder, ReminderType } from '../lib/types'

// Icon and colours per reminder type (prototype REM_TYPES).
export const REM_META: Record<ReminderType, { icon: LucideIcon; tone: string; dot: string }> = {
  follow: { icon: Send, tone: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  interview: { icon: Calendar, tone: 'bg-gold-100 text-gold-800', dot: 'bg-gold-500' },
  deadline: { icon: AlarmClock, tone: 'bg-coral-100 text-coral-700', dot: 'bg-coral-600' },
  custom: { icon: Bell, tone: 'bg-paper-200 text-ink-700', dot: 'bg-ink-400' },
}

export const isOverdue = (r: Pick<Reminder, 'due_at' | 'snoozed_until' | 'done'>) => !r.done && daysAgo(whenDue(r)) > 0

// "Tomorrow, 14:00" (prototype `when`).
export const whenLabel = (iso: string) => `${relDay(iso)}, ${fmtTime(iso)}`

// A reminder as a coloured strip (prototype `RemChip`); red when overdue.
export default function RemChip({ r, onClick, compact }: { r: Reminder; onClick?: () => void; compact?: boolean }) {
  const { icon: Icon, tone } = REM_META[r.type]
  const late = isOverdue(r)
  const look = late ? 'bg-coral-100 text-coral-700' : tone
  const content = (
    <>
      <Icon size={compact ? 13 : 16} className="shrink-0" />
      <span className={`min-w-0 flex-1 truncate font-semibold ${compact ? 'text-xs font-medium' : 'text-[13px]'}`}>{r.title}</span>
      <span className={`whitespace-nowrap font-mono ${compact ? 'text-xs' : 'text-xs font-medium'}`}>
        {late ? 'Overdue · ' : ''}
        {compact ? relDay(whenDue(r)) : whenLabel(whenDue(r))}
      </span>
    </>
  )
  const cls = `flex w-full items-center text-left leading-[1.3] ${compact ? 'gap-1.5 rounded-lg px-2 py-1.5' : 'gap-2.5 rounded-xl px-3 py-2.5'} ${look}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:brightness-[.97]`}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}
