import { CURRENCIES, type Application } from '../lib/types'
import { FieldLabel } from './ui'

// Salary as currency + min–max in thousands per year ("GBP 75 – 90 k").
// The prototype uses one free-text box ("£80–95k"); separate boxes avoid guessing.
export type SalaryDraft = { currency: string; min: string; max: string }

export const emptySalary: SalaryDraft = { currency: 'USD', min: '', max: '' }

export function salaryDraft(a: Pick<Application, 'salary_min' | 'salary_max' | 'salary_currency'>): SalaryDraft {
  const k = (n: number | null) => (n == null ? '' : String(n / 1000))
  return { currency: a.salary_currency ?? 'USD', min: k(a.salary_min), max: k(a.salary_max) }
}

// Draft → DB columns. A lone max with no min is fine; currency is only stored with an amount.
export function salaryValues(s: SalaryDraft) {
  const num = (v: string) => (v.trim() === '' || isNaN(+v) ? null : Math.round(+v * 1000))
  let min = num(s.min)
  let max = num(s.max)
  if (min != null && max != null && max < min) [min, max] = [max, min]
  return { salary_min: min, salary_max: max, salary_currency: min == null && max == null ? null : s.currency }
}

const box =
  'h-8 rounded-lg border-[1.5px] border-paper-300 bg-surface px-2 text-sm text-ink outline-none hover:border-ink-300 focus:border-blue-500 focus:shadow-[0_0_0_3px_var(--color-focus)]'

export default function SalaryInput({
  id,
  value,
  onChange,
  onBlur,
  label = 'Salary',
}: {
  id: string
  value: SalaryDraft
  onChange: (v: SalaryDraft) => void
  onBlur?: () => void
  label?: string
}) {
  // Save once focus leaves the whole group, not when hopping between its boxes.
  const blur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onBlur && !e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur()
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5" onBlur={blur}>
      <FieldLabel htmlFor={`${id}-min`}>{label}</FieldLabel>
      <div className="flex items-center gap-1.5 font-mono text-[13px] text-ink-500">
        <select
          aria-label="Currency"
          value={value.currency}
          onChange={(e) => onChange({ ...value, currency: e.target.value })}
          className={`${box} cursor-pointer`}
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          id={`${id}-min`}
          aria-label="Minimum, in thousands"
          inputMode="decimal"
          placeholder="min"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          className={`${box} w-full min-w-0`}
        />
        –
        <input
          aria-label="Maximum, in thousands"
          inputMode="decimal"
          placeholder="max"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          className={`${box} w-full min-w-0`}
        />
        k
      </div>
    </div>
  )
}
