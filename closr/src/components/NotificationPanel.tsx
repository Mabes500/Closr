import { useEffect, useState } from 'react'
import { AlarmClock, BellOff, Calendar, CheckCheck, X, type LucideIcon } from 'lucide-react'
import { KEEP_DAYS } from '../lib/notifications'
import type { AppNotification, NotificationKind } from '../lib/types'
import { Button, EmptyState, IconButton, Tabs } from './ui'

// Icon and colours per kind (prototype NOTIF_KIND).
const NOTIF_KIND: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  interview: { icon: Calendar, tone: 'bg-gold-100 text-gold-800' },
  overdue: { icon: AlarmClock, tone: 'bg-coral-100 text-coral-700' },
  deadline: { icon: AlarmClock, tone: 'bg-coral-100 text-coral-700' },
}

// "5m ago", "3h ago", "2d ago" (prototype `minsAgo`).
function minsAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  return m < 60 ? `${m}m ago` : m < 60 * 24 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`
}

// Bell panel (prototype `NotificationPanel`): All/Unread, Today/Earlier, mark all read,
// tap the dot to toggle read, Clear all. Opens beside the sidebar, or under the top bar on phones.
export default function NotificationPanel({
  items,
  narrow,
  onClose,
  onOpen,
  onMarkAll,
  onToggleRead,
  onClear,
}: {
  items: AppNotification[]
  narrow: boolean
  onClose: () => void
  onOpen: (n: AppNotification) => void
  onMarkAll: () => void
  onToggleRead: (n: AppNotification) => void
  onClear: () => void
}) {
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const unread = items.filter((n) => !n.read_at).length
  const list = items.filter((n) => tab === 'all' || !n.read_at)
  const recent = (n: AppNotification) => Date.now() - new Date(n.created_at).getTime() < 20 * 3_600_000
  const today = list.filter(recent)
  const earlier = list.filter((n) => !recent(n))
  const caughtUp = tab === 'unread' && items.length > 0

  const row = (n: AppNotification) => {
    const { icon: Icon, tone } = NOTIF_KIND[n.kind]
    const read = !!n.read_at
    return (
      <div
        key={n.id}
        role="button"
        tabIndex={0}
        onClick={() => onOpen(n)}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(n)}
        className={`flex cursor-pointer items-start gap-3 rounded-[14px] p-3 transition-colors hover:bg-paper-100 ${read ? '' : 'bg-blue-50'}`}
      >
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${tone}`}>
          <Icon size={17} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <b className={`flex-1 text-sm leading-[1.35] text-ink ${read ? 'font-medium' : 'font-semibold'}`}>{n.title}</b>
            <span className="whitespace-nowrap font-mono text-[11px] text-ink-500">{minsAgo(n.created_at)}</span>
          </div>
          <span className="text-[13px] leading-[1.45] text-ink-500">{n.body}</span>
        </div>
        <button
          type="button"
          aria-label={read ? 'Mark as unread' : 'Mark as read'}
          title={read ? 'Mark as unread' : 'Mark as read'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleRead(n)
          }}
          className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-paper-200"
        >
          <i className={`size-[9px] rounded-full border-[1.5px] ${read ? 'border-paper-400 bg-transparent' : 'border-blue-600 bg-blue-600'}`} />
        </button>
      </div>
    )
  }

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[160] ${narrow ? 'bg-overlay' : ''}`} />
      <section
        role="dialog"
        aria-label="Notifications"
        className={`fixed z-[170] flex max-h-[min(640px,calc(100vh-32px))] flex-col overflow-hidden rounded-[20px] border border-paper-200 bg-white shadow-dialog ${
          narrow ? 'inset-x-2 top-[calc(64px+env(safe-area-inset-top))]' : 'left-[242px] top-4 w-[400px]'
        }`}
      >
        <div className="flex items-center gap-2 pl-5 pr-4 pt-4">
          <h2 className="flex-1 text-lg font-semibold leading-[1.2] tracking-[-0.02em] text-ink">Notifications</h2>
          {unread > 0 && (
            <Button size="sm" variant="ghost" icon={CheckCheck} onClick={onMarkAll}>
              Mark all read
            </Button>
          )}
          <IconButton icon={X} label="Close" onClick={onClose} className="size-8" />
        </div>
        <div className="px-5 pt-1">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: unread ? `Unread (${unread})` : 'Unread' },
            ]}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2.5 pt-1.5">
          {list.length ? (
            <>
              {today.length > 0 && <Eyebrow>Today</Eyebrow>}
              {today.map(row)}
              {earlier.length > 0 && <Eyebrow>Earlier</Eyebrow>}
              {earlier.map(row)}
            </>
          ) : (
            <EmptyState
              compact
              icon={caughtUp ? CheckCheck : BellOff}
              tone="paper"
              title={caughtUp ? "You're all caught up" : 'No notifications yet'}
              body={
                caughtUp
                  ? 'New interview reminders and follow-up nudges show up here.'
                  : 'Interview reminders, follow-up nudges and deadlines will land here.'
              }
            />
          )}
        </div>
        {items.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-t border-paper-200 px-4 py-2.5">
            <span className="text-xs text-ink-500">Kept for {KEEP_DAYS} days</span>
            <Button size="sm" variant="ghost" onClick={onClear}>
              Clear all
            </Button>
          </div>
        )}
      </section>
    </>
  )
}

function Eyebrow({ children }: { children: string }) {
  return <div className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500">{children}</div>
}
