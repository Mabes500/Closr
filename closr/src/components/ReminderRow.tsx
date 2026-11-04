import { useState } from 'react'
import { AlarmClock, Briefcase, Calendar, CalendarClock, Clock, Ellipsis, Pencil, Sun, Trash2 } from 'lucide-react'
import { doneFields, snoozeUntil, useDeleteReminder, useSaveReminder, whenDue, type ReminderWithApp } from '../lib/reminders'
import { FORMAT_LABEL } from '../lib/types'
import { REM_META, isOverdue, whenLabel } from './RemChip'
import { Badge, IconButton, Menu } from './ui'

// One reminder on the Schedule screen (prototype `ReminderRow`): tick to mark done,
// snooze, and a "more" menu to edit, open the job, or delete.
export default function ReminderRow({
  r,
  onEdit,
  onJob,
}: {
  r: ReminderWithApp
  onEdit: (r: ReminderWithApp) => void
  onJob: (applicationId: string) => void
}) {
  const save = useSaveReminder()
  const del = useDeleteReminder()
  const [menu, setMenu] = useState<'snooze' | 'more' | null>(null)
  const { icon: Icon, tone } = REM_META[r.type]
  const late = isOverdue(r)
  const toggle = (m: 'snooze' | 'more') => setMenu((cur) => (cur === m ? null : m))
  const snooze = (c: Parameters<typeof snoozeUntil>[0]) => () => save.mutate({ id: r.id, snoozed_until: snoozeUntil(c).toISOString() })

  const meta = [
    <span key="t" className={`font-mono ${late ? 'text-coral-700' : 'text-ink-700'}`}>
      {whenLabel(whenDue(r))}
    </span>,
    r.application && (
      <button key="j" type="button" onClick={() => onJob(r.application!.id)} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
        {r.application.company}
      </button>
    ),
    r.type === 'interview' && r.interview_format && <span key="f">{FORMAT_LABEL[r.interview_format]}</span>,
  ].filter(Boolean)

  return (
    <div className={`flex items-start gap-3 border-t border-paper-200 py-3.5 first:border-t-0 ${r.done ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={r.done}
        onChange={() => save.mutate({ id: r.id, ...doneFields(!r.done) })}
        aria-label={`Mark done: ${r.title}`}
        className="mt-2 size-[18px] shrink-0 cursor-pointer accent-action"
      />
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${late ? 'bg-coral-100 text-coral-700' : tone}`}>
        <Icon size={17} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex flex-wrap items-center gap-2">
          <b className={`text-[15px] font-semibold leading-[1.35] text-ink ${r.done ? 'line-through' : ''}`}>{r.title}</b>
          {late && <Badge className="bg-coral-100 text-coral-700">Overdue</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.4] text-ink-500">
          {meta.flatMap((n, i) => (i ? [<span key={`s${i}`} aria-hidden="true">·</span>, n] : [n]))}
        </div>
        {(r.interviewer || r.interview_location) && (
          <div className="text-[13px] leading-[1.4] text-ink-700 [overflow-wrap:anywhere]">
            {r.interviewer && <>With {r.interviewer}</>}
            {r.interviewer && r.interview_location && ' · '}
            {r.interview_location && <span className="font-mono text-xs">{r.interview_location}</span>}
          </div>
        )}
        {r.notes && <p className="text-[13px] leading-[1.45] text-ink-500">{r.notes}</p>}
      </div>
      <div className="relative flex shrink-0 gap-0.5">
        {!r.done && <IconButton icon={AlarmClock} label="Snooze" onClick={() => toggle('snooze')} className="size-8" />}
        <IconButton icon={Ellipsis} label="More" onClick={() => toggle('more')} className="size-8" />
        <Menu
          open={menu === 'snooze'}
          onClose={() => setMenu(null)}
          head="Snooze until"
          items={[
            { label: 'Later today', hint: '+3h', icon: Clock, onClick: snooze('h3') },
            { label: 'Tomorrow', hint: '09:00', icon: Sun, onClick: snooze(1) },
            { label: 'In 3 days', icon: Calendar, onClick: snooze(3) },
            { label: 'Next week', icon: CalendarClock, onClick: snooze(7) },
          ]}
        />
        <Menu
          open={menu === 'more'}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => onEdit(r) },
            ...(r.application ? [{ label: 'Open job', icon: Briefcase, onClick: () => onJob(r.application!.id) }] : []),
            '-',
            {
              label: 'Delete',
              icon: Trash2,
              danger: true,
              onClick: () => confirm(`Delete “${r.title}”?`) && del.mutate(r.id),
            },
          ]}
        />
      </div>
    </div>
  )
}
