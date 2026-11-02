import { useState, type FormEvent } from 'react'
import { useCreateContact, useDeleteContact, useUpdateContact } from '../lib/contacts'
import type { Contact } from '../lib/types'

const field = 'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-brand'

// Add or edit a contact. Pass `contact` to edit; leave it out to add a new one.
export default function ContactDialog({ contact, onClose }: { contact?: Contact; onClose: () => void }) {
  const create = useCreateContact()
  const update = useUpdateContact()
  const del = useDeleteContact()
  const [form, setForm] = useState({
    name: contact?.name ?? '',
    company: contact?.company ?? '',
    title: contact?.title ?? '',
    email: contact?.email ?? '',
    linkedin_url: contact?.linkedin_url ?? '',
    last_contacted_at: contact?.last_contacted_at ?? '',
    notes: contact?.notes ?? '',
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const error = create.error ?? update.error ?? del.error

  async function submit(e: FormEvent) {
    e.preventDefault()
    const values = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      last_contacted_at: form.last_contacted_at || null,
      notes: form.notes.trim() || null,
    }
    if (contact) await update.mutateAsync({ id: contact.id, ...values })
    else await create.mutateAsync(values)
    onClose()
  }

  async function remove() {
    if (!contact || !confirm(`Delete ${contact.name}? They'll be unlinked from every application.`)) return
    await del.mutateAsync(contact.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">{contact ? 'Edit contact' : 'Add contact'}</h2>
        <input autoFocus required placeholder="Name" className={field} value={form.name} onChange={set('name')} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Company" className={field} value={form.company} onChange={set('company')} />
          <input placeholder="Title" className={field} value={form.title} onChange={set('title')} />
        </div>
        <input type="email" placeholder="Email" className={field} value={form.email} onChange={set('email')} />
        <input
          type="url"
          placeholder="LinkedIn URL"
          className={field}
          value={form.linkedin_url}
          onChange={set('linkedin_url')}
        />
        <label className="block text-xs text-ink-muted">
          Last contacted
          <input type="date" className={`${field} mt-1`} value={form.last_contacted_at} onChange={set('last_contacted_at')} />
        </label>
        <textarea placeholder="Notes (optional)" rows={3} className={field} value={form.notes} onChange={set('notes')} />
        {error && <p className="text-sm text-status-rejected">{error.message}</p>}
        <div className="flex items-center gap-2 pt-2">
          {contact && (
            <button type="button" onClick={remove} className="text-sm text-ink-faint hover:text-status-rejected">
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
            Cancel
          </button>
          <button
            disabled={create.isPending || update.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {create.isPending || update.isPending ? 'Saving…' : contact ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
