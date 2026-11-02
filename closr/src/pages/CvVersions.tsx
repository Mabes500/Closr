import { useState } from 'react'
import { Archive, ArchiveRestore, ChevronDown, ChevronRight, FileText, Info, Pencil } from 'lucide-react'
import { Badge, Button, Card, Dialog, EmptyState, IconButton, Input, Select, TextArea, TopBar } from '../components/ui'
import { useApplications } from '../lib/applications'
import { cvStats, MIN_TO_COMPARE, useCvVersions, useSaveCvVersion, type CvStats } from '../lib/cvVersions'
import { useStatusEvents } from '../lib/events'
import { CV_FORMATS, type CvVersion } from '../lib/types'

const formatOptions = (current?: string | null) => [
  { value: '', label: 'Format not set' },
  ...[...CV_FORMATS, ...(current && !(CV_FORMATS as readonly string[]).includes(current) ? [current] : [])].map((f) => ({ value: f, label: f })),
]
const EMPTY: CvStats = { sent: 0, responses: 0, interviews: 0, rate: null }

// Prototype `CvScreen`: your CV versions with how each one is doing, and a row to add one.
export default function CvVersions() {
  const { data: versions = [], isLoading, error } = useCvVersions()
  const { data: apps = [] } = useApplications()
  const { data: events = [] } = useStatusEvents()
  const save = useSaveCvVersion()
  const [label, setLabel] = useState('')
  const [format, setFormat] = useState<string>(CV_FORMATS[0])
  const [editing, setEditing] = useState<CvVersion | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const stats = cvStats(apps, events)
  const active = versions.filter((v) => !v.archived_at)
  const archived = versions.filter((v) => v.archived_at)
  // Comparing needs at least two versions with enough applications each.
  const comparable = active.filter((v) => (stats.get(v.id)?.sent ?? 0) >= MIN_TO_COMPARE).length

  const add = () => {
    if (!label.trim()) return
    save.mutate({ label: label.trim(), format: format || null }, { onSuccess: () => setLabel('') })
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <TopBar title="CV versions" />
      <div className="flex max-w-[760px] flex-col gap-3.5">
        <p className="text-sm leading-normal text-ink-500">Label each version you send. Closr shows which one gets responses.</p>
        {error && <p className="text-sm text-coral-700">{error.message}</p>}

        {isLoading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : active.length ? (
          <Card>
            {active.map((v, i) => (
              <Row key={v.id} v={v} s={stats.get(v.id) ?? EMPTY} first={i === 0} onEdit={() => setEditing(v)} onArchive={() => save.mutate({ id: v.id, archived_at: new Date().toISOString() })} />
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              compact
              icon={FileText}
              title="No CV versions yet"
              body="Add a label for each CV you send, like “Design · EU CV v1”. Pick it when you log an application and Closr will show which version gets replies."
            />
          </Card>
        )}

        {active.length > 0 && comparable < 2 && (
          <div className="flex items-start gap-2.5 rounded-xl bg-paper-100 px-4 py-3 text-[13px] leading-[1.45] text-ink-700">
            <Info size={16} className="mt-px shrink-0 text-ink-500" />
            <span>
              Too little data to compare yet. Response rates start to mean something once a version has been sent to at least {MIN_TO_COMPARE} jobs
              {active.length > 1 ? ', and you need two versions like that to compare them' : ''}.
            </span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <Input
            id="cv-label"
            placeholder="New version label, e.g. Backend · Canada résumé v1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            wrapClassName="flex-[1_1_260px]"
          />
          <Select id="cv-format" value={format} onChange={(e) => setFormat(e.target.value)} options={formatOptions()} wrapClassName="w-[210px]" />
          <Button type="submit" disabled={!label.trim() || save.isPending}>
            Add version
          </Button>
        </form>
        {save.error && <p className="text-sm text-coral-700">{save.error.message}</p>}

        {archived.length > 0 && (
          <div>
            <Button variant="ghost" size="sm" icon={showArchived ? ChevronDown : ChevronRight} onClick={() => setShowArchived(!showArchived)}>
              {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
            </Button>
            {showArchived && (
              <Card className="mt-2">
                {archived.map((v, i) => (
                  <Row key={v.id} v={v} s={stats.get(v.id) ?? EMPTY} first={i === 0} onEdit={() => setEditing(v)} onRestore={() => save.mutate({ id: v.id, archived_at: null })} />
                ))}
              </Card>
            )}
          </div>
        )}
      </div>

      {editing && <EditDialog v={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function Row({
  v,
  s,
  first,
  onEdit,
  onArchive,
  onRestore,
}: {
  v: CvVersion
  s: CvStats
  first: boolean
  onEdit: () => void
  onArchive?: () => void
  onRestore?: () => void
}) {
  const enough = s.sent >= MIN_TO_COMPARE
  return (
    <div className={`flex flex-wrap items-center gap-3.5 px-5 py-4 ${first ? '' : 'border-t border-paper-200'} ${v.archived_at ? 'opacity-70' : ''}`}>
      <div className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md border border-paper-200 bg-paper-100">
        <FileText size={18} className="text-ink-400" />
      </div>
      <div className="min-w-0 flex-[1_1_180px]">
        <b className="text-[15px] font-semibold text-ink">{v.label}</b>
        <div className="text-[13px] text-ink-500">{v.format || 'Format not set'}</div>
        {v.notes && <div className="mt-0.5 text-[13px] text-ink-500">{v.notes}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[13px] text-ink-500">
        <Badge>
          {s.sent} job{s.sent === 1 ? '' : 's'}
        </Badge>
        <span>
          {s.responses} response{s.responses === 1 ? '' : 's'}
        </span>
        <span className={s.interviews ? 'text-mint-700' : undefined}>
          {s.interviews} interview{s.interviews === 1 ? '' : 's'}
        </span>
        <span
          title={enough ? undefined : `Shown once this version has been sent to ${MIN_TO_COMPARE} jobs`}
          className={enough ? 'font-medium text-ink' : 'text-ink-400'}
        >
          {s.rate == null ? '—' : `${Math.round(s.rate * 100)}%`} {enough ? 'response rate' : '· too few to tell'}
        </span>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <IconButton icon={Pencil} label={`Rename ${v.label}`} onClick={onEdit} className="size-8" />
        {onArchive && <IconButton icon={Archive} label={`Archive ${v.label}`} onClick={onArchive} className="size-8" />}
        {onRestore && <IconButton icon={ArchiveRestore} label={`Restore ${v.label}`} onClick={onRestore} className="size-8" />}
      </div>
    </div>
  )
}

// Rename a version, change its format or add notes.
function EditDialog({ v, onClose }: { v: CvVersion; onClose: () => void }) {
  const save = useSaveCvVersion()
  const [d, setD] = useState({ label: v.label, format: v.format ?? '', notes: v.notes ?? '' })
  const submit = () =>
    save.mutate({ id: v.id, label: d.label.trim(), format: d.format || null, notes: d.notes.trim() || null }, { onSuccess: onClose })
  return (
    <Dialog
      title="Edit CV version"
      description="Jobs already linked to it keep the link."
      onClose={onClose}
      width={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!d.label.trim() || save.isPending} onClick={submit}>
            Save changes
          </Button>
        </>
      }
    >
      <Input id="cve-label" label="Label" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} autoFocus />
      <Select id="cve-format" label="Format" value={d.format} onChange={(e) => setD({ ...d, format: e.target.value })} options={formatOptions(v.format)} />
      <TextArea id="cve-notes" label="Notes" rows={3} placeholder="What's different in this version" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
      {save.error && <p className="text-sm text-coral-700">{save.error.message}</p>}
    </Dialog>
  )
}
