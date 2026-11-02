import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Application, Reminder, ReminderFields } from './types'

// Reminders: follow-ups, interviews, deadlines and other (roadmap 3.1).

const KEY = ['reminders'] as const

export type ReminderWithApp = Reminder & { application: Pick<Application, 'id' | 'company' | 'role' | 'status'> | null }

export function useReminders() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*, application:applications(id, company, role, status)')
        .order('due_at', { ascending: true })
      if (error) throw error
      return data as ReminderWithApp[]
    },
  })
}

// Adding an interview can move its job to Interviewing (a DB trigger), so the board refreshes too.
const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: KEY })
  qc.invalidateQueries({ queryKey: ['applications'] })
}

// Create (no id) or update (with id).
export function useSaveReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ReminderFields> & { id?: string }) => {
      const { error } = id
        ? await supabase.from('reminders').update(values).eq('id', id)
        : await supabase.from('reminders').insert(values as ReminderFields)
      if (error) throw error
    },
    // Optimistic for edits (done, snooze), so ticking feels instant.
    onMutate: async ({ id, ...values }) => {
      if (!id) return
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData<ReminderWithApp[]>(KEY)
      qc.setQueryData<ReminderWithApp[]>(KEY, (rs) => rs?.map((r) => (r.id === id ? { ...r, ...values } : r)))
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => refresh(qc),
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => refresh(qc),
  })
}

// When a reminder is due: its snooze time if snoozed, otherwise its due time.
export const whenDue = (r: Pick<Reminder, 'due_at' | 'snoozed_until'>) => r.snoozed_until ?? r.due_at

// Done/undone, recording when.
export const doneFields = (done: boolean) => ({ done, done_at: done ? new Date().toISOString() : null })

// Local date/time helpers for the dialog.
export const pad = (n: number) => String(n).padStart(2, '0')
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export function plusDays(n: number, hour = 9) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d
}
// Snooze choices (prototype ReminderRow menu): +3 hours, or a number of days at 09:00.
export type SnoozeChoice = 'h3' | 1 | 3 | 7
export function snoozeUntil(choice: SnoozeChoice) {
  if (choice !== 'h3') return plusDays(choice)
  const d = new Date()
  d.setHours(d.getHours() + 3, d.getMinutes(), 0, 0)
  return d
}

export function nextMonday(hour = 9) {
  const d = plusDays(1, hour)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return d
}
