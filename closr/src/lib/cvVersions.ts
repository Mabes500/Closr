import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { StatusEvent } from './events'
import { groupStats, type GroupStats } from './stats'
import { supabase } from './supabase'
import type { Application, CvVersion } from './types'

// CV versions (roadmap 4.1).

const KEY = ['cv_versions'] as const

// Oldest first, so the list keeps its order as you add versions.
export function useCvVersions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('cv_versions').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data as CvVersion[]
    },
  })
}

// Create (no id) or update (with id): add, rename, archive or restore.
export function useSaveCvVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Pick<CvVersion, 'label' | 'format' | 'notes' | 'archived_at'>> & { id?: string }) => {
      const { error } = id
        ? await supabase.from('cv_versions').update(values).eq('id', id)
        : await supabase.from('cv_versions').insert(values)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export { MIN_TO_COMPARE } from './stats'
export type CvStats = GroupStats

// Per version: jobs sent with it, responses, interviews and response rate (see groupStats).
export const cvStats = (apps: Application[], events: StatusEvent[]) => groupStats(apps, events, (a) => a.cv_version_id)
