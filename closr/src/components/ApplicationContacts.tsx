import { useState, type FormEvent } from 'react'
import { followUp, useContacts, useCreateContact, useLinkContact, useUnlinkContact } from '../lib/contacts'
import type { Application } from '../lib/types'

const field = 'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-brand'

// Contacts section of the application drawer: linked people, linking an existing
// contact, and adding a new one inline (it's linked straight away).
export default function ApplicationContacts({ app }: { app: Application }) {
  const { data: contacts = [], isLoading } = useContacts()
  const create = useCreateContact()
  const link = useLinkContact()
  const unlink = useUnlinkContact()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', title: '', email: '' })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const linked = contacts.filter((c) => c.links.some((l) => l.application_id === app.id))
  const others = contacts.filter((c) => !linked.includes(c))
  const appsById = new Map([[app.id, app]])
  const error = create.error ?? link.error ?? unlink.error

  async function addNew(e: FormEvent) {
    e.preventDefault()
    const contact = await create.mutateAsync({
      name: form.name.trim(),
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      company: app.company,
    })
    await link.mutateAsync({ application_id: app.id, contact_id: contact.id })
    setForm({ name: '', title: '', email: '' })
    setAdding(false)
  }

  return (
    <section className="border-t border-line p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Contacts</h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-sm font-medium text-brand hover:underline">
            + New contact
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          {linked.length ? (
            <div className="flex flex-col gap-2">
              {linked.map((c) => {
                const f = followUp(c, appsById)
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {[c.title, c.email].filter(Boolean).join(' · ') || c.company}
                      </p>
                    </div>
                    {f && (
                      <span className="shrink-0 rounded bg-spark-soft px-1.5 py-0.5 text-xs text-ink">
                        Follow up · {f.days}d
                      </span>
                    )}
                    <button
                      onClick={() => unlink.mutate({ application_id: app.id, contact_id: c.id })}
                      className="rounded px-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                      aria-label={`Unlink ${c.name}`}
                      title="Unlink from this application"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            !adding && <p className="text-sm text-ink-faint">No one linked yet.</p>
          )}

          {adding && (
            <form onSubmit={addNew} className="mt-3 space-y-2 rounded-lg border border-line bg-canvas p-3">
              <input autoFocus required placeholder="Name" className={field} value={form.name} onChange={set('name')} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Title" className={field} value={form.title} onChange={set('title')} />
                <input type="email" placeholder="Email" className={field} value={form.email} onChange={set('email')} />
              </div>
              <p className="text-xs text-ink-faint">Saved at {app.company}. Add more details from the Contacts page.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-ink-muted hover:text-ink">
                  Cancel
                </button>
                <button
                  disabled={create.isPending || link.isPending}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  {create.isPending || link.isPending ? 'Saving…' : 'Add and link'}
                </button>
              </div>
            </form>
          )}

          {others.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && link.mutate({ application_id: app.id, contact_id: e.target.value })}
              className="mt-3 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink-muted outline-none focus:border-brand"
            >
              <option value="">Link an existing contact…</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` (${c.company})` : ''}
                </option>
              ))}
            </select>
          )}
          {error && <p className="mt-2 text-sm text-status-rejected">{error.message}</p>}
        </>
      )}
    </section>
  )
}
