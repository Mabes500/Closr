import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { localDate } from './stats'
import { supabase } from './supabase'
import type { Application, JobMatch, JobPosting, MatchStatus, VisaSponsorship } from './types'

// The Jobs screen (roadmap 6.2d): today's matches from the daily pipeline (6.2a–c).

const KEY = ['job_matches'] as const
const DAY = 86_400_000

export type MatchWithPosting = JobMatch & { posting: JobPosting }

// Matches from the last two weeks, best first within each day. Descriptions are only
// loaded on the posting page.
const POSTING_COLS =
  'id, source, company, title, location, countries, work_mode, salary_min, salary_max, salary_currency, salary_period, apply_url, posted_at, first_seen_at, closed_at, role_title, seniority, visa_sponsorship, remote_regions, remote_countries, timezone_note'

export function useMatches() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const since = localDate(new Date(Date.now() - 14 * DAY))
      const { data, error } = await supabase
        .from('job_matches')
        .select(`*, posting:job_postings(${POSTING_COLS})`)
        .gte('match_date', since)
        .order('match_date', { ascending: false })
        .order('score', { ascending: false })
      if (error) throw error
      return (data as MatchWithPosting[]).filter((m) => m.posting)
    },
  })
}

// The newest day's batch is "today's matches", even if the daily run hasn't happened yet today.
export const latestDay = (ms: MatchWithPosting[]) => ms.reduce<string | null>((d, m) => (!d || m.match_date > d ? m.match_date : d), null)

// One posting with its description, plus this user's match for it, if any.
export function usePosting(id: string | undefined) {
  return useQuery({
    queryKey: ['job_postings', id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: posting, error }, { data: match }] = await Promise.all([
        supabase.from('job_postings').select('*').eq('id', id!).maybeSingle(),
        supabase.from('job_matches').select('*').eq('posting_id', id!).maybeSingle(),
      ])
      if (error) throw error
      return posting ? { posting: posting as JobPosting, match: match as JobMatch | null } : null
    },
  })
}

// Save / dismiss / undo. Optimistic, so the card reacts at once.
export function useUpdateMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: MatchStatus; dismiss_reason?: string | null }) => {
      const { error } = await supabase.from('job_matches').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData<MatchWithPosting[]>(KEY)
      qc.setQueryData<MatchWithPosting[]>(KEY, (ms) => ms?.map((m) => (m.id === id ? { ...m, ...patch } : m)))
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY })
      // The posting page shows the match's status too.
      qc.invalidateQueries({ queryKey: ['job_postings'] })
    },
  })
}

const PER_YEAR: Record<string, number> = { year: 1, month: 12, week: 52, day: 260, hour: 2080 }

// The board keeps salaries per year in whole units.
export function annualSalary(p: Pick<JobPosting, 'salary_min' | 'salary_max' | 'salary_currency' | 'salary_period'>) {
  const k = p.salary_period ? PER_YEAR[p.salary_period] : 0
  if (!k || !p.salary_currency || (p.salary_min == null && p.salary_max == null)) return { salary_min: null, salary_max: null, salary_currency: null }
  const y = (n: number | null) => (n == null ? null : Math.round(Number(n) * k))
  return { salary_min: y(p.salary_min), salary_max: y(p.salary_max), salary_currency: p.salary_currency }
}

const VISA: Record<string, VisaSponsorship> = { yes: 'yes', no: 'no' }

// "Save to board" (Saved) or "I applied" (Applied): a new job filled in from the posting,
// source "Job board", linked to the posting; the match is marked saved.
export function useTakeMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ posting, matchId, applied }: { posting: JobPosting; matchId: string | null; applied: boolean }) => {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          company: posting.company,
          role: posting.title,
          job_url: posting.apply_url,
          location: posting.location,
          work_mode: posting.work_mode,
          visa_sponsorship: VISA[posting.visa_sponsorship ?? ''] ?? 'unknown',
          ...annualSalary(posting),
          source: 'job_board',
          status: applied ? 'applied' : 'saved',
          applied_at: applied ? localDate(new Date()) : null,
          job_posting_id: posting.id,
        })
        .select()
        .single()
      if (error) throw error
      if (matchId) {
        const { error: e2 } = await supabase.from('job_matches').update({ status: 'saved' }).eq('id', matchId)
        if (e2) throw e2
      }
      return data as Application
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['job_postings'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

// Which of these postings have closed (for saved jobs on the board).
export function useClosedPostings(ids: string[]) {
  const key = [...new Set(ids)].sort()
  return useQuery({
    queryKey: ['job_postings', 'closed', key],
    enabled: key.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('job_postings').select('id').in('id', key).not('closed_at', 'is', null)
      if (error) throw error
      return new Set((data as { id: string }[]).map((r) => r.id))
    },
  })
}

// "via Greenhouse · posted 3d ago"
export const SOURCE_NAME: Record<JobPosting['source'], string> = { greenhouse: 'Greenhouse', lever: 'Lever', ashby: 'Ashby' }
export const postedOn = (p: Pick<JobPosting, 'posted_at' | 'first_seen_at'>) =>
  p.posted_at && p.posted_at < p.first_seen_at ? p.posted_at : p.first_seen_at

// "Not for me" reasons (feed future ranking).
export const DISMISS_REASONS = ['Wrong role', 'Wrong location', 'Too senior', 'Too junior', 'Salary too low', 'Not this company']
