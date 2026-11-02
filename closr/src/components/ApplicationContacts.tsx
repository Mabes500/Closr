import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { followUp, useContacts, useCreateContact, useLinkContact, useUnlinkContact } from '../lib/contacts'
import type { Application } from '../lib/types'
import { Avatar, Button, Input, SectionTitle } from './ui'

// Contacts section of the job drawer (prototype JobDrawer "Contacts"): linked people,
// adding someone inline (saved at this company and linked straight away), and linking
// someone already in your contacts. The "Follow up" badge opens the job's follow-up reminder.
export default function ApplicationContacts({ app, onFollowUp }: { app: Application; onFollowUp: (contactName: string) => void }) {
  const { data: contacts = [] } = useContacts()
  const create = useCreateContact()
  const link = useLinkContact()
  const unlink = useUnlinkContact()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  const linked = contacts.filter((c) => c.links.some((l) => l.application_id === app.id))
  const others = contacts.filter((c) => !linked.includes(c))
  const appsById = new Map([[app.id, app]])
  const error = create.error ?? link.error ?? unlink.error

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const contact = await create.mutateAsync({ name: name.trim(), title: role.trim() || null, company: app.company })
    await link.mutateAsync({ application_id: app.id, contact_id: contact.id })
    setName('')
    setRole('')
  }

  return (
    <div>
      <SectionTitle>Contacts</SectionTitle>
      {!linked.length && <p className="mb-1 text-[13px] text-ink-500">No contacts yet. Add the recruiter or someone who can refer you.</p>}
      {linked.map((c) => {
        const f = followUp(c, appsById)
        return (
          <div key={c.id} className="flex items-center gap-2.5 border-b border-paper-200 py-2">
            <Avatar name={c.name} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
              <div className="truncate text-xs text-ink-500">{c.title || c.email || 'Contact'}</div>
            </div>
            {f && (
              <button
                type="button"
                onClick={() => onFollowUp(c.name)}
                title="Open the follow-up reminder"
                className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-800 hover:brightness-[.97]"
              >
                Follow up · {f.days}d
              </button>
            )}
            <button
              onClick={() => unlink.mutate({ application_id: app.id, contact_id: c.id })}
              aria-label={`Unlink ${c.name}`}
              title="Unlink from this job"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-paper-100 hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
      <form onSubmit={add} className="mt-2.5 flex items-end gap-2">
        <Input id={`cn-${app.id}`} inputSize="sm" placeholder="Name, e.g. Ada Okafor" value={name} onChange={(e) => setName(e.target.value)} wrapClassName="flex-1" />
        <Input id={`cr-${app.id}`} inputSize="sm" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} wrapClassName="flex-1" />
        <Button type="submit" size="sm" variant="secondary" disabled={!name.trim() || create.isPending || link.isPending}>
          Add
        </Button>
      </form>
      {others.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && link.mutate({ application_id: app.id, contact_id: e.target.value })}
          aria-label="Link an existing contact"
          className="mt-2 h-8 w-full cursor-pointer rounded-lg border-[1.5px] border-paper-300 bg-white px-2.5 text-[13px] text-ink-500 outline-none hover:border-ink-300 focus:border-blue-500"
        >
          <option value="">Or link someone you've already added…</option>
          {others.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.company ? ` (${c.company})` : ''}
            </option>
          ))}
        </select>
      )}
      {error && <p className="mt-2 text-sm text-coral-700">{error.message}</p>}
    </div>
  )
}
