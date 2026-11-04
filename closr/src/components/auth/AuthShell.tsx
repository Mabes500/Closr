import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { Logo } from '../Logo'

export type Banner = { tone: 'success' | 'info'; text: string }

// Layout shared by every auth screen (prototype `AuthShell`): form column on the
// left, brand art on the right. Below 861px the art is hidden.
export default function AuthShell({ children, banner }: { children: ReactNode; banner?: Banner | null }) {
  return (
    <div className="grid min-h-screen bg-paper-50 min-[861px]:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)]">
      <div className="flex flex-col px-[max(16px,env(safe-area-inset-left))] pb-10 pt-[22px] min-[861px]:px-10 min-[861px]:pt-7">
        <Logo size={28} />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="flex w-full max-w-[400px] flex-col gap-6">
            {banner && (
              <div
                role="status"
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium leading-[1.45] ${
                  banner.tone === 'success' ? 'bg-mint-100 text-mint-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {banner.tone === 'success' ? (
                  <CircleCheck size={18} className="mt-px shrink-0" />
                ) : (
                  <Info size={18} className="mt-px shrink-0" />
                )}
                <span>{banner.text}</span>
              </div>
            )}
            {children}
          </div>
        </div>
        {/* Privacy and Terms pages come with roadmap item 7.3. */}
        <div className="text-xs leading-normal text-ink-400">
          © {new Date().getFullYear()} Closr · <span className="font-semibold text-blue-600">Privacy</span> ·{' '}
          <span className="font-semibold text-blue-600">Terms</span>
        </div>
      </div>
      <AuthArt />
    </div>
  )
}

const ART_ROWS = [
  { company: 'Kestrel Pay', color: 'bg-blue-600', role: 'Senior Backend Engineer', stage: 'Applied', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  { company: 'Fernway Health', color: 'bg-mint-600', role: 'Staff Software Engineer', stage: 'Interview', badge: 'bg-gold-100 text-gold-800', dot: 'bg-gold-500' },
  { company: 'Brightmile', color: 'bg-blue-700', role: 'Full-stack Engineer', stage: 'Offer', badge: 'bg-mint-100 text-mint-700', dot: 'bg-mint-600' },
]

function AuthArt() {
  return (
    <div className="relative m-3 hidden flex-col justify-center gap-9 overflow-hidden rounded-[28px] bg-oxford-900 px-11 py-12 min-[861px]:flex">
      <svg viewBox="0 0 28 28" width="420" height="420" aria-hidden="true" className="absolute -right-[140px] -top-[120px] opacity-[.14]">
        <path d="M26.5 14A12.5 12.5 0 1 1 14 1.5" fill="none" stroke="var(--color-blue-500)" strokeWidth="2" />
        <circle cx="22.84" cy="5.16" r="3" fill="var(--color-gold-400)" />
      </svg>
      <div className="relative flex max-w-[420px] flex-col gap-3">
        <div className="text-[11px] font-semibold uppercase leading-none tracking-[.08em] text-gold-400">Job search, tracked</div>
        <h2 className="text-[38px] font-bold leading-[1.08] tracking-[-0.03em] text-white">Every application in one calm board.</h2>
        <p className="text-base leading-[1.55] text-white/75">
          Save roles from anywhere, follow up on time, and see what's working for people with your goal.
        </p>
      </div>
      <div className="relative flex max-w-[400px] flex-col gap-2.5">
        {ART_ROWS.map((r, i) => (
          <div
            key={r.company}
            style={{ marginLeft: i * 18 }}
            className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[.07] px-3.5 py-3"
          >
            <div className={`flex size-[34px] shrink-0 items-center justify-center rounded-[10px] text-[15px] font-semibold text-on-action ${r.color}`}>
              {r.company[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-[1.3] text-white">{r.role}</div>
              <div className="text-xs leading-[1.3] text-white/60">{r.company}</div>
            </div>
            <span className={`inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${r.badge}`}>
              <span className={`size-[7px] rounded-full ${r.dot}`} />
              {r.stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.03em] text-ink">{title}</h1>
      {sub && <p className="text-[15px] leading-normal text-ink-500">{sub}</p>}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-xl bg-coral-100 px-3.5 py-3 text-sm font-medium leading-[1.45] text-coral-700">
      <CircleAlert size={18} className="mt-px shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function OrRule() {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-ink-400">
      <i className="h-px flex-1 bg-paper-200" />
      or
      <i className="h-px flex-1 bg-paper-200" />
    </div>
  )
}
