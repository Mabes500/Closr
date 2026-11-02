import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { StatusEvent } from './events'
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

// Below this many applications a version's response rate says little.
export const MIN_TO_COMPARE = 5

export type CvStats = { sent: number; responses: number; interviews: number; rate: number | null }

// Per version: jobs sent with it (anything past Saved), responses (moved past Applied:
// reached Interviewing or Offer, or closed as Rejected; "No response" doesn't count),
// interviews (reached Interviewing or Offer), and the response rate.
export function cvStats(apps: Application[], events: StatusEvent[]) {
  const reachedInterview = new Set(
    events.filter((e) => e.to_status === 'interviewing' || e.to_status === 'offer').map((e) => e.application_id),
  )
  const stats = new Map<string, CvStats>()
  for (const a of apps) {
    if (!a.cv_version_id || a.status === 'saved') continue
    const s = stats.get(a.cv_version_id) ?? { sent: 0, responses: 0, interviews: 0, rate: null }
    const interviewed = a.status === 'interviewing' || a.status === 'offer' || reachedInterview.has(a.id)
    s.sent++
    if (interviewed) s.interviews++
    if (interviewed || (a.status === 'closed' && a.close_reason === 'rejected')) s.responses++
    s.rate = s.responses / s.sent
    stats.set(a.cv_version_id, s)
  }
  return stats
}
