// `onDark` uses the lighter ring the prototype uses on oxford backgrounds.
export function Mark({ size = 28, onDark }: { size?: number; onDark?: boolean }) {
  return (
    <svg viewBox="-1 -1 30 30" width={size} height={size} aria-hidden="true">
      <path
        d="M26.5 14A12.5 12.5 0 1 1 14 1.5"
        fill="none"
        stroke={onDark ? 'var(--color-blue-400)' : 'var(--color-brand)'}
        strokeWidth="3"
      />
      <circle cx="22.84" cy="5.16" r="3.5" fill="var(--color-spark)" />
    </svg>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={size} />
      <span className="text-xl font-semibold tracking-tight text-ink">Closr</span>
    </span>
  )
}
