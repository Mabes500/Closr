import { useState } from 'react'
import ContactDialog from '../components/ContactDialog'
import { useApplications } from '../lib/applications'
import { followUp, useContacts, useUpdateContact, type ContactWithLinks } from '../lib/contacts'
import { localDate } from '../lib/stats'
import { STATUS_LABEL, type Application, type Contact } from '../lib/types'

export default function Contacts() {
  const { data: contacts = [], isLoading, error } = useContacts()
  const { data: apps = [] } = useApplications()
  const update = useUpdateContact()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Contact | 'new' | null>(null)

  const appsById = new Map(apps.map((a) => [a.id, a]))
  const q = query.trim().toLowerCase()
  const shown = q
    ? contacts.filter((c) => [c.name, c.company, c.title, c.email].some((v) => v?.toLowerCase().includes(q)))
    : contacts
  const toFollowUp = shown.flatMap((c) => {
    const f = followUp(c, appsById)
    return f ? [{ contact: c, ...f }] : []
  })
  const markContacted = (id: string) => update.mutate({ id, last_contacted_at: localDate(new Date()) })

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {contacts.length} people · {toFollowUp.length} to follow up
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + Add contact
        </button>
      </div>

      <input
        type="search"
        placeholder="Search by name, company, title or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
      />

      {error && <p className="text-sm text-status-rejected">{error.message}</p>}
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-8">
          {toFollowUp.length > 0 && (
            <section className="rounded-xl border border-line bg-surface/60 p-4">
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full bg-spark" />
                <h2 className="text-sm font-semibold">Follow up</h2>
                <span className="font-mono text-xs text-ink-faint">{toFollowUp.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {toFollowUp.map(({ contact, days, apps: open }) => (
                  <div
                    key={contact.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {contact.last_contacted_at ? `Last contacted ${days} days ago` : `Not contacted yet, added ${days} days ago`}
                        {' · '}
                        {open.map((a) => `${a.company} (${STATUS_LABEL[a.status]})`).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => markContacted(contact.id)}
                      className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-canvas"
                    >
                      Mark contacted today
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <header className="mb-3 flex items-center gap-2 px-1">
              <h2 className="text-sm font-semibold text-ink-muted">{q ? 'Matches' : 'Everyone'}</h2>
              <span className="font-mono text-xs text-ink-faint">{shown.length}</span>
            </header>
            {shown.length ? (
              <div className="flex flex-col gap-2">
                {shown.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    apps={c.links.map((l) => appsById.get(l.application_id)).filter((a): a is Application => !!a)}
                    onOpen={() => setEditing(c)}
                  />
                ))}
              </div>
            ) : (
              <p className="px-1 py-4 text-sm text-ink-faint">
                {q ? 'No one matches that search.' : 'No contacts yet. Add recruiters, hiring managers and referrers here.'}
              </p>
            )}
          </section>
        </div>
      )}

      {editing && <ContactDialog contact={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ContactRow({ contact: c, apps, onOpen }: { contact: ContactWithLinks; apps: Application[]; onOpen: () => void }) {
  return (
    <article
      // Clicks on the email and LinkedIn links shouldn't open the editor.
      onClick={(e) => !(e.target as HTMLElement).closest('a') && onOpen()}
      className="cursor-pointer rounded-lg border border-line bg-surface p-3 shadow-sm hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          {(c.title || c.company) && (
            <p className="truncate text-sm text-ink-muted">{[c.title, c.company].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        {c.last_contacted_at && <span className="shrink-0 font-mono text-xs text-ink-faint">{c.last_contacted_at}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {c.email && (
          <a href={`mailto:${c.email}`} className="text-brand hover:underline">
            {c.email}
          </a>
        )}
        {c.linkedin_url && (
          <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
            LinkedIn
          </a>
        )}
        {apps.map((a) => (
          <span key={a.id} className="flex items-center gap-1 rounded bg-canvas px-1.5 py-0.5 text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--color-status-${a.status})` }} />
            {a.company}
          </span>
        ))}
      </div>
    </article>
  )
}
