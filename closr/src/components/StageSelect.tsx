import { ChevronDown } from 'lucide-react'
import { STAGE_BADGE } from '../lib/board'
import { STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from '../lib/types'

// Compact stage chip for board cards and list rows: looks like the prototype's stage
// Badge, with a native <select> laid over it so phones get their own picker. It reports
// the choice through `onChange`, which must be the board's changeStatus (the same path
// as drag-and-drop), so Closed asks for a reason and cancelling leaves the job as it was.
export default function StageSelect({
  app,
  onChange,
  onPicking,
}: {
  app: Application
  onChange: (id: string, status: ApplicationStatus) => void
  // True while the menu is in use, so a draggable card can stop dragging meanwhile.
  onPicking?: (picking: boolean) => void
}) {
  const { badge, dot } = STAGE_BADGE[app.status]
  // Keep clicks, keys and drags on the chip from reaching the card or row around it.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <span
      className={`relative inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-1.5 text-[11px] font-semibold leading-none focus-within:shadow-[0_0_0_3px_var(--color-focus)] ${badge}`}
      onClick={stop}
      onKeyDown={stop}
      onPointerDown={(e) => {
        e.stopPropagation()
        onPicking?.(true)
      }}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span className={`size-[7px] rounded-full ${dot}`} />
      {STATUS_LABEL[app.status]}
      <ChevronDown size={12} />
      <select
        aria-label={`Stage: ${STATUS_LABEL[app.status]}. Change stage`}
        value={app.status}
        draggable={false}
        onChange={(e) => {
          onPicking?.(false)
          onChange(app.id, e.target.value as ApplicationStatus)
        }}
        onBlur={() => onPicking?.(false)}
        // Invisible, and taller than the chip (44px) so it's easy to tap on a phone.
        className="absolute inset-x-0 -inset-y-[11px] cursor-pointer appearance-none opacity-0"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </span>
  )
}
