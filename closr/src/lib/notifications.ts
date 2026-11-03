import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fmtTime, relDay } from './board'
import type { Checkin } from './checkins'
import { supabase } from './supabase'
import { whenDue, type ReminderWithApp } from './reminders'
import type { AppNotification, NotificationKind } from './types'

// In-app notifications (roadmap 3.3, check-ins 4.2). No email or scheduled jobs: the app
// creates them itself from your reminders and check-ins when it loads (and when they change), and the
// database's unique dedupe_key stops the same one being created twice.

const KEY = ['notifications'] as const
const DAY = 86_400_000
export const KEEP_DAYS = 30

export type NewNotification = Pick<AppNotification, 'kind' | 'reminder_id' | 'application_id' | 'title' | 'body' | 'dedupe_key'>

// Which reminders deserve a nudge right now:
// interviews in the next 24 hours, follow-ups due or overdue, deadlines within 24 hours or overdue.
// The key includes the due time, so snoozing or moving a reminder earns one fresh nudge.
export function notificationsFor(reminders: ReminderWithApp[], now = new Date()): NewNotification[] {
  const out: NewNotification[] = []
  for (const r of reminders) {
    if (r.done) continue
    const due = whenDue(r)
    const ms = new Date(due).getTime() - now.getTime()
    const company = r.application?.company
    let kind: NotificationKind | null = null
    let title = ''
    if (r.type === 'interview' && ms >= 0 && ms <= DAY) {
      kind = 'interview'
      title = company ? `Interview with ${company}` : `Interview: ${r.title}`
    } else if (r.type === 'follow' && ms <= 0) {
      kind = 'overdue'
      title = company ? `Time to follow up with ${company}` : r.title
    } else if (r.type === 'deadline' && ms <= DAY) {
      kind = 'deadline'
      title = company ? `${company}: ${r.title}` : r.title
    }
    if (!kind) continue
    const when = `${relDay(due)}, ${fmtTime(due)}`
    const body = kind === 'interview' ? `${r.title} · ${when}` : ms < 0 ? `${r.title} · was due ${when}` : `${r.title} · due ${when}`
    out.push({ kind, reminder_id: r.id, application_id: r.application_id, title, body, dedupe_key: `${r.type}:${r.id}:${due}` })
  }
  return out
}

// One "how's it going" per quiet job. The key includes when it went quiet, so answering
// "No reply yet" and going quiet for another week earns a new one.
export function checkinNotifications(due: Checkin[]): NewNotification[] {
  return due.map(({ app, days, quietSince }) => ({
    kind: 'checkin',
    reminder_id: null,
    application_id: app.id,
    title: `How's it going with ${app.company}?`,
    body: `Applied ${days} days ago for ${app.role}. Heard back?`,
    dedupe_key: `checkin:${app.id}:${quietSince}`,
  }))
}

// Streak milestones get one nudge each (per streak: a new streak can earn them again).
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365]

export function streakNotifications(streak: number, startedOn: string): NewNotification[] {
  const m = [...STREAK_MILESTONES].reverse().find((x) => streak >= x)
  if (!m) return []
  return [
    {
      kind: 'streak',
      reminder_id: null,
      application_id: null,
      title: `${m}-day streak`,
      body: `You've touched your search every day for ${m} days.`,
      dedupe_key: `streak:${startedOn}:${m}`,
    },
  ]
}

// "N new matches today": one per daily batch of job matches (roadmap 6.2d), counting the
// ones not yet saved or dismissed when the batch is first seen.
export function matchNotifications(day: string | null, fresh: number, today: string): NewNotification[] {
  if (!day || !fresh || day < today) return []
  return [
    {
      kind: 'matches',
      reminder_id: null,
      application_id: null,
      title: `${fresh} new match${fresh === 1 ? '' : 'es'} today`,
      body: "Picked for your roles from employers' own job boards.",
      dedupe_key: `matches:${day}`,
    },
  ]
}

// Your notifications from the last 30 days, newest first (cleared ones hidden).
export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const since = new Date(Date.now() - KEEP_DAYS * DAY).toISOString()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .is('cleared_at', null)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AppNotification[]
    },
  })
}

// Creates any missing notifications (`null` while the data is still loading), and removes
// ones older than 30 days. Runs once loaded, and again whenever the set of nudges changes.
export function useSyncNotifications(wanted: NewNotification[] | null) {
  const qc = useQueryClient()
  const signature = wanted?.map((n) => n.dedupe_key).join('|')
  useEffect(() => {
    if (!wanted) return
    let cancelled = false
    ;(async () => {
      const old = new Date(Date.now() - KEEP_DAYS * DAY).toISOString()
      await supabase.from('notifications').delete().lt('created_at', old)
      if (wanted.length) {
        const { error } = await supabase.from('notifications').upsert(wanted, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
        if (error) console.warn('Could not create notifications:', error.message)
      }
      if (!cancelled) qc.invalidateQueries({ queryKey: KEY })
    })()
    return () => {
      cancelled = true
    }
    // `signature` stands in for `wanted`, which is a new array every render.
  }, [signature, qc])
}

// Read/unread, mark all read, clear all. Optimistic, so the panel reacts at once.
export function useUpdateNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<Pick<AppNotification, 'read_at' | 'cleared_at'>> }) => {
      if (!ids.length) return
      const { error } = await supabase.from('notifications').update(patch).in('id', ids)
      if (error) throw error
    },
    onMutate: async ({ ids, patch }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData<AppNotification[]>(KEY)
      qc.setQueryData<AppNotification[]>(KEY, (ns) =>
        ns?.flatMap((n) => (!ids.includes(n.id) ? [n] : patch.cleared_at ? [] : [{ ...n, ...patch }])),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
