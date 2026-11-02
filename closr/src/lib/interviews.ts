import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Application, Interview, NewInterview } from './types'

const KEY = ['interviews'] as const

export type InterviewWithApp = Interview & { application: Pick<Application, 'id' | 'company' | 'role'> | null }

// All of the user's interviews, soonest first. Small enough to load at once;
// the drawer filters this list rather than running its own query.
export function useInterviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*, application:applications(id, company, role)')
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return data as InterviewWithApp[]
    },
  })
}

export function useCreateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewInterview) => {
      const { error } = await supabase.from('interviews').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      // A DB trigger may have moved the application to Interviewing.
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useUpdateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Interview> & { id: string }) => {
      const { error } = await supabase.from('interviews').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Splits interviews into the sections both the page and the drawer show.
// "Next 7 days" starts at midnight today, so an interview from this morning still shows.
export function groupInterviews<T extends Interview>(interviews: T[], now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const next7: T[] = []
  const later: T[] = []
  const past: T[] = []
  for (const i of interviews) {
    const t = new Date(i.scheduled_at)
    if (t < today) past.push(i)
    else if (t < weekEnd) next7.push(i)
    else later.push(i)
  }
  past.reverse() // most recent first
  return { next7, later, past }
}
