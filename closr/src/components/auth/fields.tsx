import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, Globe, Lock, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Form building blocks for the auth screens, matching the prototype's Input,
// PasswordInput, Strength, Button, Checkbox and BackLink.

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

// 0 empty, 1 too short, 2 weak, 3 good, 4 strong (same rule as the prototype).
export function pwScore(p: string) {
  if (!p) return 0
  if (p.length < 8) return 1
  return Math.min(
    4,
    1 + (/\d/.test(p) ? 1 : 0) + (/[A-Z]/.test(p) && /[a-z]/.test(p) ? 1 : 0) + (/[^A-Za-z0-9]/.test(p) || p.length >= 14 ? 1 : 0),
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  icon?: LucideIcon
  error?: string
  hint?: ReactNode
  trailing?: ReactNode
}

export function TextField({ id, label, icon: Icon, error, hint, trailing, ...input }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold leading-[1.2] text-ink">
        {label}
      </label>
      <div
        className={`flex min-h-10 items-center gap-2 rounded-xl border-[1.5px] bg-surface px-3 text-ink-400 transition-[border-color,box-shadow] focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_var(--color-focus)] ${
          error ? 'border-coral-400' : 'border-paper-300 hover:border-ink-300'
        }`}
      >
        {Icon && <Icon size={17} className="shrink-0" />}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-[1.4] text-ink outline-none placeholder:text-ink-400"
          {...input}
        />
        {trailing}
      </div>
      {(error || hint) && (
        <span id={`${id}-hint`} className={`text-xs leading-[1.4] ${error ? 'text-coral-700' : 'text-ink-500'}`}>
          {error || hint}
        </span>
      )}
    </div>
  )
}

export function PasswordField(props: Omit<FieldProps, 'type' | 'icon' | 'trailing'>) {
  const [show, setShow] = useState(false)
  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      icon={Lock}
      trailing={
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
          className="-mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-paper-100 hover:text-ink"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  )
}

const STRENGTH = [
  { label: '', bar: 'bg-paper-200' },
  { label: 'Too short', bar: 'bg-coral-600' },
  { label: 'Weak', bar: 'bg-gold-500' },
  { label: 'Good', bar: 'bg-blue-600' },
  { label: 'Strong', bar: 'bg-mint-600' },
]

export function Strength({ value }: { value: string }) {
  const s = pwScore(value)
  if (!value)
    return (
      <span className="text-xs leading-[1.4] text-ink-500">
        At least 8 characters. A number and a capital letter make it stronger.
      </span>
    )
  return (
    <div className="flex items-center gap-2.5" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={`h-1 flex-1 rounded transition-colors duration-200 ${i <= s ? STRENGTH[s].bar : 'bg-paper-200'}`} />
        ))}
      </div>
      <span className={`min-w-[62px] text-right text-xs font-semibold leading-none ${s <= 1 ? 'text-coral-700' : 'text-ink-500'}`}>
        {STRENGTH[s].label}
      </span>
    </div>
  )
}

const btnBase =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] px-6 text-base font-semibold leading-none transition-[background,border-color,transform] active:scale-[.97] focus-visible:shadow-[0_0_0_3px_var(--color-focus)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100'

export function PrimaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${btnBase} border-transparent bg-action text-on-action hover:enabled:bg-action-hover`} {...rest}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${btnBase} border-paper-300 bg-surface text-ink hover:enabled:border-ink-300 hover:enabled:bg-paper-50`}
      {...rest}
    >
      {children}
    </button>
  )
}

// Google sign-in returns to the app root; for a signed-in user that is the board.
// The redirect URL must be listed under Supabase → Authentication → URL Configuration.
export function GoogleButton({ children, onError }: { children: ReactNode; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setBusy(false)
      onError(error.message)
    }
  }
  return (
    <SecondaryButton onClick={go} disabled={busy}>
      <Globe size={19} />
      <span>{children}</span>
    </SecondaryButton>
  )
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label htmlFor={id} className="group inline-flex cursor-pointer select-none items-start gap-2.5 text-[15px] leading-[1.4] text-ink">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-ink-300 bg-surface text-surface transition-all group-hover:border-ink-500 peer-checked:scale-[1.06] peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:shadow-[0_0_0_3px_var(--color-focus)]">
        <Check size={14} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </label>
  )
}

export function BackLink({ to, state, children }: { to: string; state?: unknown; children: ReactNode }) {
  return (
    <Link
      to={to}
      state={state}
      className="-ml-0.5 inline-flex items-center gap-1.5 self-start rounded-lg py-1.5 pl-0.5 pr-2 text-sm font-semibold leading-none text-ink-500 hover:bg-paper-100 hover:text-ink"
    >
      <ArrowLeft size={16} />
      {children}
    </Link>
  )
}

// Text links in the auth screens use the brand blue, like the prototype's default link style.
export const linkClass = 'font-semibold text-blue-600 underline-offset-[3px] hover:text-blue-700 hover:underline'
