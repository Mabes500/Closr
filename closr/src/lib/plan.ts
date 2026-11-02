import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

// "Your plan this week" on Goals (roadmap 5.2): which steps you've marked done, per week.
export type PlanStep = 'followups' | 'saved' | 'checkins' | 'target'

const key = (week: string) => ['plan_steps_done', week]

export function usePlanDone(week: string) {
  return useQuery({
    queryKey: key(week),
    queryFn: async () => {
      const { data, error } = await supabase.from('plan_steps_done').select('step').eq('week_start', week)
      if (error) throw error
      return new Set((data as { step: PlanStep }[]).map((r) => r.step))
    },
  })
}

// Optimistic, so the tick lands at once.
export function useTogglePlanStep(week: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ step, done }: { step: PlanStep; done: boolean }) => {
      const { error } = done
        ? await supabase.from('plan_steps_done').insert({ week_start: week, step })
        : await supabase.from('plan_steps_done').delete().eq('week_start', week).eq('step', step)
      if (error) throw error
    },
    onMutate: async ({ step, done }) => {
      await qc.cancelQueries({ queryKey: key(week) })
      const previous = qc.getQueryData<Set<PlanStep>>(key(week))
      const next = new Set(previous)
      if (done) next.add(step)
      else next.delete(step)
      qc.setQueryData(key(week), next)
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key(week), ctx?.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key(week) })
      // Marking a step done counts toward the streak.
      qc.invalidateQueries({ queryKey: ['applications', 'activity_days'] })
    },
  })
}
