import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Application, ApplicationStatus, CloseReason, NewApplication } from './types'

const KEY = ['applications'] as const

export function useApplications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('position', { ascending: false })
      if (error) throw error
      return data as Application[]
    },
  })
}

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewApplication) => {
      const { data, error } = await supabase.from('applications').insert(input).select().single()
      if (error) throw error
      return data as Application
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Application> & { id: string }) => {
      const { error } = await supabase.from('applications').update(patch).eq('id', id)
      if (error) throw error
    },
    // Optimistic update so drag-and-drop feels instant.
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData<Application[]>(KEY)
      qc.setQueryData<Application[]>(KEY, (apps) => apps?.map((a) => (a.id === id ? { ...a, ...patch } : a)))
      return { previous }
    },
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Closed needs a reason; any other stage clears it (the DB rejects a mismatch).
export function useMoveApplication() {
  const update = useUpdateApplication()
  return (id: string, status: ApplicationStatus, reason: CloseReason | null = null) =>
    update.mutate({ id, status, close_reason: status === 'closed' ? reason : null, position: Date.now() / 1000 })
}

export function useDeleteApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('applications').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
