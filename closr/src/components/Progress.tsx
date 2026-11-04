import type { ReactNode } from 'react'

// Prototype `ProgressRing`: a ring that fills toward `max`, with a gold spark at the tip.
export function ProgressRing({
  value,
  max,
  size = 64,
  stroke = 6,
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  const a = -Math.PI / 2 + pct * 2 * Math.PI
  const tipX = size / 2 + r * Math.cos(a)
  const tipY = size / 2 + r * Math.sin(a)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value} of ${max}`}>
      <svg width={size} height={size} className="block -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-paper-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="stroke-blue-600 transition-[stroke-dashoffset] duration-[600ms] ease-[cubic-bezier(.34,1.56,.64,1)]"
        />
      </svg>
      {pct > 0 && (
        <span
          className="absolute rounded-full bg-gold-500 shadow-[0_0_0_2px_var(--color-surface)]"
          style={{ left: tipX - stroke * 0.75, top: tipY - stroke * 0.75, width: stroke * 1.5, height: stroke * 1.5 }}
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center font-bold leading-none text-ink" style={{ fontSize: Math.round(size * 0.24) }}>
          {children}
        </div>
      )}
    </div>
  )
}

// Prototype `StreakDots`: the last six days, then today.
export function StreakDots({ streak, activeToday }: { streak: number; activeToday: boolean }) {
  const before = Math.min(6, streak - (activeToday ? 1 : 0))
  const lit = [0, 1, 2, 3, 4, 5].map((i) => i >= 6 - before).concat(activeToday)
  return (
    <div className="flex gap-[5px]" aria-hidden="true">
      {lit.map((on, i) => (
        <i key={i} className={`h-1.5 flex-1 rounded-[3px] ${on ? 'bg-gold-500' : 'bg-paper-200'}`} />
      ))}
    </div>
  )
}
