import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { ApplicationEvent } from './types'

// Nested under ['applications'] so every application mutation (which can log a
// new event via the DB trigger) also refreshes this query.
const KEY = ['applications', 'events'] as const

export type StatusEvent = Pick<ApplicationEvent, 'application_id' | 'to_status' | 'occurred_at'>

// Only the history the stats need: when each application left Saved, and
// whether it ever reached Interviewing or Offer.
export function useStatusEvents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_events')
        .select('application_id, to_status, occurred_at')
        .in('to_status', ['applied', 'interviewing', 'offer'])
      if (error) throw error
      return data as StatusEvent[]
    },
  })
}
