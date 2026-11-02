import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

// "People like you" (roadmap 5.3). The database function returns anonymous totals only,
// and nothing at all unless at least 20 other users share one of your target roles
// (see the 5.3 migration). No sample data is ever shown in its place.

export type PeerRow = { source: string; interviews: number; offers: number; peers: number }

export function usePeopleLikeYou(enabled: boolean) {
  return useQuery({
    queryKey: ['people_like_you'],
    enabled,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('people_like_you')
      if (error) throw error
      return ((data ?? []) as PeerRow[]).map((r) => ({ ...r, interviews: Number(r.interviews), offers: Number(r.offers), peers: Number(r.peers) }))
    },
  })
}
