import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from './supabase'
import type { Profile } from './types'

// Keyed by user so a different account on the same device never sees a stale profile.
const key = (userId: string | undefined) => ['profile', userId] as const

// The signed-in user's profile row (created by the on_auth_user_created trigger).
export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: key(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })
}

// Optimistic, so autosaving fields and the onboarding redirect see the change at once.
export function useUpdateProfile() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const userId = session?.user.id
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId!)
      if (error) throw error
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key(userId) })
      const previous = qc.getQueryData<Profile | null>(key(userId))
      if (previous) qc.setQueryData<Profile>(key(userId), { ...previous, ...patch })
      return { previous }
    },
    onError: (_err, _patch, ctx) => ctx?.previous !== undefined && qc.setQueryData(key(userId), ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key(userId) }),
  })
}

// First name for greetings: profile name, then sign-up metadata (email or Google), then email.
export function firstName(profile: Profile | null | undefined, meta: Record<string, string | undefined>, email?: string) {
  const full = profile?.full_name || meta.full_name || meta.name || ''
  return full.trim().split(/\s+/)[0] || email?.split('@')[0] || 'there'
}
