import { supabase } from './supabase'
import type { Application, Reminder } from './types'

// "Export my data" (roadmap 7.1): one CSV of the user's jobs, reminders and notes, built in
// the browser from what Row Level Security lets them read, so it downloads right away.

const COLUMNS = ['type', 'company', 'role', 'stage', 'title', 'reminder_type', 'due', 'done', 'location', 'work_mode', 'salary_min', 'salary_max', 'salary_currency', 'source', 'applied_on', 'job_link', 'next_action', 'notes', 'created'] as const
type Row = Partial<Record<(typeof COLUMNS)[number], unknown>>

// Spreadsheets run cells starting with these as formulas; a leading ' keeps them as text.
export const safeCell = (v: unknown) => {
  if (v == null) return ''
  const s = String(v)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

export function exportRows(apps: Application[], reminders: Reminder[]): Row[] {
  const jobOf = new Map(apps.map((a) => [a.id, a]))
  return [
    ...apps.map((a) => ({
      type: 'job',
      company: a.company,
      role: a.role,
      stage: a.status,
      location: a.location,
      work_mode: a.work_mode,
      salary_min: a.salary_min,
      salary_max: a.salary_max,
      salary_currency: a.salary_currency,
      source: a.source,
      applied_on: a.applied_at,
      job_link: a.job_url,
      next_action: a.next_action,
      notes: a.notes,
      created: a.created_at,
    })),
    ...reminders.map((r) => {
      const job = r.application_id ? jobOf.get(r.application_id) : undefined
      return {
        type: 'reminder',
        company: job?.company,
        role: job?.role,
        title: r.title,
        reminder_type: r.type,
        due: r.snoozed_until ?? r.due_at,
        done: r.done ? 'yes' : 'no',
        notes: r.notes,
        created: r.created_at,
      }
    }),
  ]
}

// Every row of a table, 1,000 at a time (Supabase returns at most 1,000 per request).
async function all<T>(table: 'applications' | 'reminders'): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').order('created_at').range(from, from + 999)
    if (error) throw error
    out.push(...(data as T[]))
    if (data.length < 1000) return out
  }
}

export async function downloadMyData() {
  const [apps, reminders] = await Promise.all([all<Application>('applications'), all<Reminder>('reminders')])
  const { default: Papa } = await import('papaparse')
  const rows = exportRows(apps, reminders).map((r) => COLUMNS.map((c) => safeCell(r[c])))
  // The leading mark tells Excel it's UTF-8, so accents and € survive.
  const csv = `﻿${Papa.unparse({ fields: [...COLUMNS], data: rows })}`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = `closr-export-${new Date().toLocaleDateString('en-CA')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  return { jobs: apps.length, reminders: reminders.length }
}
