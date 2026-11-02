import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown, Plus, X, type LucideIcon } from 'lucide-react'

// App building blocks matching docs/prototype.html's design system
// (Dialog, Drawer, Tabs, Switch, Select, Input, Button, Field, SectionTitle,
// CompanyTile, Avatar). Auth screens have their own in components/auth.

export const focusRing = 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-focus)]'

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'spark'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconRight?: LucideIcon
}

const BUTTON_VARIANT = {
  primary: 'border-transparent bg-oxford-900 text-white hover:enabled:bg-oxford-800',
  secondary: 'border-paper-300 bg-white text-ink hover:enabled:border-ink-300 hover:enabled:bg-paper-50',
  ghost: 'border-transparent bg-transparent text-ink-700 hover:enabled:bg-paper-100 hover:enabled:text-ink',
  spark:
    'border-transparent bg-gold-500 text-ink shadow-[0_3px_0_var(--color-oxford-900)] hover:enabled:-translate-y-px hover:enabled:bg-gold-400',
}

const BUTTON_SIZE = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-[18px] text-[15px]',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-base',
}
const ICON_SIZE = { sm: 15, md: 17, lg: 19 }

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap border-[1.5px] font-semibold leading-none transition-[background,border-color,transform] active:enabled:scale-[.97] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${BUTTON_SIZE[size]} ${BUTTON_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={ICON_SIZE[size]} />}
      {children}
      {IconRight && <IconRight size={ICON_SIZE[size]} />}
    </button>
  )
}

export function IconButton({ icon: Icon, label, onClick, className = '' }: { icon: LucideIcon; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-paper-100 hover:text-ink ${focusRing} ${className}`}
    >
      <Icon size={18} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------
const ctl = (size: 'sm' | 'md') =>
  `flex items-center gap-2 border-[1.5px] border-paper-300 bg-white px-3 text-ink-400 transition-[border-color,box-shadow] hover:border-ink-300 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_var(--color-focus)] ${
    size === 'sm' ? 'min-h-8 rounded-lg' : 'min-h-10 rounded-xl'
  }`
const ctlInput = 'min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-[1.4] text-ink outline-none placeholder:text-ink-400'

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-semibold leading-[1.2] text-ink">
      {children}
    </label>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label?: string
  icon?: LucideIcon
  inputSize?: 'sm' | 'md'
  hint?: ReactNode
  wrapClassName?: string
}

export function Input({ id, label, icon: Icon, inputSize = 'md', hint, wrapClassName = '', className = '', ...rest }: InputProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${wrapClassName}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className={ctl(inputSize)}>
        {Icon && <Icon size={17} className="shrink-0" />}
        <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={`${ctlInput} ${className}`} {...rest} />
      </div>
      {hint && (
        <span id={`${id}-hint`} className="text-xs leading-[1.4] text-ink-500">
          {hint}
        </span>
      )}
    </div>
  )
}

export function TextArea({
  id,
  label,
  wrapClassName = '',
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label?: string; wrapClassName?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${wrapClassName}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className={ctl('md')}>
        <textarea id={id} className={`${ctlInput} min-h-[84px] resize-y py-2.5`} {...rest} />
      </div>
    </div>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string
  label?: string
  options: readonly { value: string; label: string }[]
  selectSize?: 'sm' | 'md'
  wrapClassName?: string
}

export function Select({ id, label, options, selectSize = 'md', wrapClassName = '', ...rest }: SelectProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${wrapClassName}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className={`relative pr-[34px] ${ctl(selectSize)}`}>
        <select id={id} className={`${ctlInput} cursor-pointer appearance-none ${selectSize === 'sm' ? 'h-[30px]' : 'h-[38px]'}`} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3" />
      </div>
    </div>
  )
}

// `ariaLabel` names the switch when its visible text sits elsewhere (label="").
export function Switch({
  id,
  label,
  ariaLabel,
  checked,
  onChange,
}: {
  id: string
  label: string
  ariaLabel?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2.5 text-[15px] font-medium leading-[1.3] text-ink">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-label={ariaLabel}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-paper-300 transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgb(0_33_71/0.25)] after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-4 peer-focus-visible:shadow-[0_0_0_3px_var(--color-focus)]" />
      {label && <span>{label}</span>}
    </label>
  )
}

// Line tabs (dialog tabs) and pill tabs (stage picker), as in the prototype's Tabs.
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'line',
  className = '',
}: {
  items: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  variant?: 'line' | 'pill'
  className?: string
}) {
  const wrap = variant === 'line' ? 'flex gap-5 border-b border-paper-200' : 'flex gap-1 rounded-xl bg-paper-100 p-1'
  return (
    <div role="tablist" className={`${wrap} ${className}`}>
      {items.map((it) => {
        const selected = it.value === value
        const look =
          variant === 'line'
            ? `-mb-px border-b-[2.5px] py-3 ${selected ? 'border-blue-600 text-ink' : 'border-transparent'}`
            : `h-8 justify-center rounded-[9px] px-3.5 ${selected ? 'bg-white text-ink shadow-[0_1px_2px_rgb(0_33_71/0.08)]' : ''}`
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(it.value)}
            className={`inline-flex items-center whitespace-nowrap text-sm font-semibold leading-none text-ink-500 transition-all hover:text-ink ${focusRing} ${look}`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
function useEscape(onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, enabled])
}

export function Dialog({
  title,
  description,
  onClose,
  footer,
  width = 480,
  children,
}: {
  title: string
  description?: ReactNode
  onClose: () => void
  footer?: ReactNode
  width?: number
  children: ReactNode
}) {
  useEscape(onClose)
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 backdrop-blur-[3px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="flex max-h-full w-full flex-col gap-[18px] overflow-y-auto rounded-[28px] bg-white p-7 shadow-dialog"
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <h3 className="text-[22px] font-bold leading-[1.25] tracking-[-0.02em] text-ink">{title}</h3>
            {description && <p className="text-[15px] leading-normal text-ink-500">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-1.5 -mt-1" />
        </div>
        {children}
        {footer && <div className="mt-1 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}

// Right-hand drawer. `escapeEnabled` lets a dialog opened on top take Escape first.
export function Drawer({
  title,
  subtitle,
  leading,
  onClose,
  escapeEnabled = true,
  children,
}: {
  title: string
  subtitle?: ReactNode
  leading?: ReactNode
  onClose: () => void
  escapeEnabled?: boolean
  children: ReactNode
}) {
  useEscape(onClose, escapeEnabled)
  return (
    <div onClick={onClose} className="fixed inset-0 z-[90] flex justify-end bg-overlay backdrop-blur-[3px]">
      <aside
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[480px] flex-col overflow-hidden rounded-l-[22px] bg-white shadow-dialog"
      >
        <div className="flex items-start gap-3.5 border-b border-paper-200 px-6 pb-[18px] pt-[22px]">
          {leading}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-[21px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">{title}</h3>
            {subtitle && <span className="text-sm leading-[1.4] text-ink-500">{subtitle}</span>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-6 pb-7 pt-5">{children}</div>
      </aside>
    </div>
  )
}

// Bottom-of-screen message with an optional action (prototype `Toast`). Hides itself
// after `ms` unless the pointer is over it.
export function Toast({
  icon: Icon,
  title,
  message,
  action,
  onClose,
  ms = 9000,
}: {
  icon?: LucideIcon
  title: string
  message?: ReactNode
  action?: { label: string; onClick: () => void }
  onClose: () => void
  ms?: number
}) {
  const [hover, setHover] = useState(false)
  useEffect(() => {
    if (hover) return
    const t = setTimeout(onClose, ms)
    return () => clearTimeout(t)
  }, [hover, ms, onClose])
  return (
    <div
      role="status"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 right-4 z-[300] flex items-start gap-3 rounded-2xl bg-oxford-900 px-4 py-3.5 text-white shadow-dialog min-[861px]:left-[calc(248px+32px)] min-[861px]:right-auto min-[861px]:w-[380px]"
    >
      {Icon && <Icon size={20} className="mt-px shrink-0 text-gold-400" />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="text-sm font-bold leading-[1.35]">{title}</strong>
        {message && <span className="text-[13px] leading-[1.45] text-white/80">{message}</span>}
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className="shrink-0 text-[13px] font-bold leading-[1.35] underline underline-offset-[3px]">
          {action.label}
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}

// Small pop-up menu (prototype `Menu`). Place it inside a `relative` wrapper that also
// holds the button opening it; clicks outside that wrapper, or Escape, close it.
export type MenuItem = { label: string; icon?: LucideIcon; hint?: string; danger?: boolean; onClick: () => void } | '-'

export function Menu({ open, onClose, head, items }: { open: boolean; onClose: () => void; head?: string; items: MenuItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div ref={ref} role="menu" className="absolute right-0 top-[38px] z-50 flex min-w-[200px] flex-col rounded-[14px] border border-paper-200 bg-white p-1.5 shadow-dialog">
      {head && <span className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500">{head}</span>}
      {items.map((it, i) => {
        if (it === '-') return <span key={i} className="my-1 h-px bg-paper-200" />
        const Icon = it.icon
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              it.onClick()
            }}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium hover:bg-paper-100 ${focusRing} ${it.danger ? 'text-coral-700' : 'text-ink'}`}
          >
            {Icon && <Icon size={16} className={it.danger ? '' : 'text-ink-500'} />}
            <span className="flex-1">{it.label}</span>
            {it.hint && <span className="font-mono text-xs text-ink-500">{it.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------
// Screen heading row (prototype `TopBar`): title, optional subtitle, actions on the right.
export function TopBar({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">{title}</h1>
      {sub && <span className="text-sm leading-[1.4] text-ink-500">{sub}</span>}
      <span className="flex-1" />
      {children}
    </div>
  )
}

export function Card({ children, sunken, className = '' }: { children: ReactNode; sunken?: boolean; className?: string }) {
  const look = sunken ? 'border-transparent bg-paper-100' : 'border-paper-200 bg-white'
  return <div className={`rounded-2xl border ${look} ${className}`}>{children}</div>
}

const EMPTY_TONES = { blue: 'bg-blue-100 text-blue-600', paper: 'bg-paper-200 text-ink-500' }

// `art` replaces the icon tile (e.g. the Closr mark); `compact` is the smaller variant.
export function EmptyState({
  icon: Icon,
  art,
  title,
  body,
  tone = 'blue',
  compact,
  children,
}: {
  icon?: LucideIcon
  art?: ReactNode
  title: string
  body?: ReactNode
  tone?: keyof typeof EMPTY_TONES
  compact?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-2 px-3 py-5' : 'gap-3 px-5 py-9'}`}>
      {art ??
        (Icon && (
          <div className={`flex items-center justify-center ${compact ? 'size-11 rounded-[13px]' : 'size-14 rounded-2xl'} ${EMPTY_TONES[tone]}`}>
            <Icon size={compact ? 22 : 28} />
          </div>
        ))}
      <b className={`font-semibold leading-[1.25] tracking-[-0.02em] text-ink [text-wrap:balance] ${compact ? 'text-base' : 'text-xl'}`}>{title}</b>
      {body && <p className="max-w-[420px] text-sm leading-normal text-ink-500">{body}</p>}
      {children && <div className="mt-1.5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

// Small pill label (prototype `Badge`), optionally with a coloured dot.
export function Badge({ className = 'bg-paper-200 text-ink-700', dot, children }: { className?: string; dot?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold leading-none ${className}`}>
      {dot && <span className={`size-[7px] shrink-0 rounded-full ${dot}`} />}
      {children}
    </span>
  )
}

// Role chips (prototype `RoleChip` / `SuggestChip`): a chosen role removes itself on
// click; a suggestion adds itself. Also used for on/off toggles (`ob-chip`).
const chip = `flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] text-sm font-medium leading-none transition-[border-color,background,transform] active:scale-[.96] ${focusRing}`
const chipOn = 'border-oxford-900 bg-oxford-900 pl-3.5 pr-2.5 text-white hover:border-oxford-800 hover:bg-oxford-800'
const chipOff = 'border-paper-300 bg-white pl-2.5 pr-3.5 text-ink hover:border-ink-300'

export function RoleChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className={`${chip} ${chipOn}`}>
      {label}
      <X size={14} />
    </button>
  )
}

// `id`/`active` let a search box highlight a suggestion with the arrow keys.
export function SuggestChip({ label, onAdd, id, active }: { label: string; onAdd: () => void; id?: string; active?: boolean }) {
  return (
    <button
      type="button"
      id={id}
      role={id ? 'option' : undefined}
      aria-selected={id ? !!active : undefined}
      onClick={onAdd}
      className={`${chip} ${chipOff} ${active ? 'border-blue-600 shadow-[0_0_0_3px_var(--color-focus)]' : ''}`}
    >
      <Plus size={14} className="text-ink-400" />
      {label}
    </button>
  )
}

export function ToggleChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`${chip} px-3.5 ${on ? chipOn : chipOff}`}>
      {children}
    </button>
  )
}

// Filter chip (prototype `Tag` with onClick).
export function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-[30px] items-center whitespace-nowrap rounded-full border-[1.5px] px-3 text-[13px] font-medium leading-none transition-all active:scale-[.96] ${focusRing} ${
        selected
          ? 'border-oxford-900 bg-oxford-900 text-white hover:border-oxford-800 hover:bg-oxford-800'
          : 'border-paper-300 bg-white text-ink-700 hover:border-ink-300 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="flex-1 text-[15px] font-semibold text-ink">{children}</div>
      {right}
    </div>
  )
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${full ? 'col-span-full' : ''}`}>
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <div className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

// Company initial on a coloured tile. Colour is picked from the name so it's stable.
const TILE_COLORS = ['bg-blue-600', 'bg-mint-600', 'bg-blue-700', 'bg-coral-600', 'bg-oxford-600', 'bg-gold-800', 'bg-ink-700']

export function CompanyTile({ name, size = 32 }: { name: string; size?: number }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)
  return (
    <div
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), fontSize: Math.round(size * 0.44) }}
      className={`flex shrink-0 items-center justify-center font-semibold leading-none text-white ${TILE_COLORS[hash % TILE_COLORS.length]}`}
    >
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function Avatar({ name, size = 34, tone = 'blue' }: { name: string; size?: number; tone?: 'blue' | 'brand' }) {
  const initials =
    (name || '?')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${
        tone === 'brand' ? 'bg-oxford-900 text-white' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {initials}
    </div>
  )
}
