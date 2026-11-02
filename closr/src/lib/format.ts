import { daysSince } from './contacts'
import { CURRENCY_SYMBOL, type Application } from './types'

// "£75–90k", "£75k+", "Up to £90k" or "No salary" (prototype `money`).
export function formatSalary(a: Pick<Application, 'salary_min' | 'salary_max' | 'salary_currency'>) {
  const { salary_min: min, salary_max: max } = a
  if (min == null && max == null) return 'No salary'
  const sym = a.salary_currency ? (CURRENCY_SYMBOL[a.salary_currency] ?? `${a.salary_currency} `) : ''
  const k = (n: number) => `${Math.round(n / 100) / 10}`
  if (min != null && max != null) return min === max ? `${sym}${k(min)}k` : `${sym}${k(min)}–${k(max)}k`
  return min != null ? `${sym}${k(min)}k+` : `Up to ${sym}${k(max!)}k`
}

// "today", "yesterday", "5d ago" (prototype `ago`).
export function ago(days: number) {
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`
}

// Days since a timestamp or YYYY-MM-DD date, in the user's own timezone.
export function daysAgo(when: string) {
  return daysSince(when.length === 10 ? when : new Date(when).toLocaleDateString('en-CA'))
}
