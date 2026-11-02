import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown, X, type LucideIcon } from 'lucide-react'

// App building blocks matching docs/prototype.html's design system
// (Dialog, Drawer, Tabs, Switch, Select, Input, Button, Field, SectionTitle,
// CompanyTile, Avatar). Auth screens have their own in components/auth.

export const focusRing = 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-focus)]'

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  icon?: LucideIcon
}

const BUTTON_VARIANT = {
  primary: 'border-transparent bg-oxford-900 text-white hover:enabled:bg-oxford-800',
  secondary: 'border-paper-300 bg-white text-ink hover:enabled:border-ink-300 hover:enabled:bg-paper-50',
  ghost: 'border-transparent bg-transparent text-ink-700 hover:enabled:bg-paper-100 hover:enabled:text-ink',
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'h-8 gap-1.5 rounded-lg px-3 text-[13px]' : 'h-10 gap-2 rounded-xl px-[18px] text-[15px]'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap border-[1.5px] font-semibold leading-none transition-[background,border-color,transform] active:enabled:scale-[.97] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${sizing} ${BUTTON_VARIANT[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} />}
      {children}
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
  wrapClassName?: string
}

export function Input({ id, label, icon: Icon, inputSize = 'md', wrapClassName = '', className = '', ...rest }: InputProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${wrapClassName}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className={ctl(inputSize)}>
        {Icon && <Icon size={17} className="shrink-0" />}
        <input id={id} className={`${ctlInput} ${className}`} {...rest} />
      </div>
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

export function Switch({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2.5 text-[15px] font-medium leading-[1.3] text-ink">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-paper-300 transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgb(0_33_71/0.25)] after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-4 peer-focus-visible:shadow-[0_0_0_3px_var(--color-focus)]" />
      <span>{label}</span>
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

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------
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
