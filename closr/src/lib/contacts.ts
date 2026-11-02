import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { localDate } from './stats'
import { supabase } from './supabase'
import type { Application, ApplicationStatus, Contact, NewContact } from './types'

const KEY = ['contacts'] as const

export type ContactWithLinks = Contact & { links: { application_id: string }[] }

// All of the user's contacts with the applications they're linked to.
export function useContacts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, links:application_contacts(application_id)')
        .order('name', { ascending: true })
      if (error) throw error
      return data as ContactWithLinks[]
    },
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewContact) => {
      const { data, error } = await supabase.from('contacts').insert(input).select().single()
      if (error) throw error
      return data as Contact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Contact> & { id: string }) => {
      const { error } = await supabase.from('contacts').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

type Link = { application_id: string; contact_id: string }

export function useLinkContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (link: Link) => {
      const { error } = await supabase.from('application_contacts').insert(link)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUnlinkContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ application_id, contact_id }: Link) => {
      const { error } = await supabase
        .from('application_contacts')
        .delete()
        .eq('application_id', application_id)
        .eq('contact_id', contact_id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const FOLLOW_UP_DAYS = 7
const STILL_OPEN: ApplicationStatus[] = ['applied', 'interviewing']

// 'YYYY-MM-DD' as local midnight, so day counts don't drift with timezones.
function parseLocalDate(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysSince(day: string, now = new Date()) {
  const today = parseLocalDate(localDate(now))
  return Math.round((today.getTime() - parseLocalDate(day).getTime()) / 86_400_000)
}

// A contact needs a follow-up when they haven't been contacted for FOLLOW_UP_DAYS
// and at least one linked application is still Applied or Interviewing.
// Never-contacted people count from when they were added, so new contacts aren't flagged at once.
export function followUp(contact: ContactWithLinks, appsById: Map<string, Application>, now = new Date()) {
  const days = daysSince(contact.last_contacted_at ?? localDate(new Date(contact.created_at)), now)
  if (days < FOLLOW_UP_DAYS) return null
  const open = contact.links
    .map((l) => appsById.get(l.application_id))
    .filter((a): a is Application => !!a && STILL_OPEN.includes(a.status))
  return open.length ? { days, apps: open } : null
}
