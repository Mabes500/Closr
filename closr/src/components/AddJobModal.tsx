import { useState } from 'react'
import { CircleCheck, Info, Link as LinkIcon } from 'lucide-react'
import { useCreateApplication } from '../lib/applications'
import { parseJob } from '../lib/parseJob'
import { localDate } from '../lib/stats'
import { STATUS_LABEL, VISA_LABEL, type ApplicationStatus, type JobChannel, type VisaSponsorship, type WorkMode } from '../lib/types'
import SalaryInput, { emptySalary, salaryValues, type SalaryDraft } from './SalaryInput'
import { Button, Dialog, Input, Select, Switch, Tabs, TextArea } from './ui'

type Tab = 'link' | 'quick'
// idle → loading ("Reading…") → read (filled from the posting) or blocked (fill in the rest).
type Phase = 'idle' | 'loading' | 'read' | 'blocked'

const MODE_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
]
const VISA_ADD_OPTIONS = (['unknown', 'yes', 'no', 'not_needed'] as const).map((v) => ({
  value: v,
  label: v === 'unknown' ? 'Unknown (not stated)' : VISA_LABEL[v],
}))

const BLANK = { title: '', company: '', location: '', mode: '' as WorkMode | '', visa: 'unknown' as VisaSponsorship, notes: '' }

// People often paste "jobs.lever.co/..." without the https://.
const withScheme = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`)

// Prototype `AddJobModal`. Paste link reads the posting through /api/parse-job and
// pre-fills a form to check before saving; Quick add needs only title and company.
// `column` is the board column the user added from, if any.
export default function AddJobModal({ column, onClose }: { column?: ApplicationStatus; onClose: () => void }) {
  const create = useCreateApplication()
  const [tab, setTab] = useState<Tab>('link')
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [linkError, setLinkError] = useState('')
  const [channel, setChannel] = useState<JobChannel | null>(null)
  const [applied, setApplied] = useState(column !== 'saved')
  const [d, setD] = useState(BLANK)
  const [salary, setSalary] = useState<SalaryDraft>(emptySalary)
  const [qt, setQt] = useState('')
  const [qc, setQc] = useState('')

  // "I've already applied" picks Applied (or the later column it was opened from); off means Saved.
  const target: ApplicationStatus = !applied ? 'saved' : column && column !== 'saved' ? column : 'applied'
  const reviewing = phase === 'read' || phase === 'blocked'
  const ready = tab === 'quick' ? qt.trim() && qc.trim() : reviewing && d.title.trim() && d.company.trim()

  async function fetchPosting() {
    if (!url.trim()) return setLinkError('Paste a job link first.')
    setLinkError('')
    setPhase('loading')
    try {
      const r = await parseJob(withScheme(url))
      const f = r.fields
      setD({
        title: f.title ?? '',
        company: f.company ?? '',
        location: f.location ?? '',
        mode: f.workMode ?? '',
        visa: 'unknown',
        notes: f.description ?? '',
      })
      setSalary(
        f.salaryMin || f.salaryMax
          ? { currency: f.currency ?? 'USD', min: f.salaryMin ? String(f.salaryMin / 1000) : '', max: f.salaryMax ? String(f.salaryMax / 1000) : '' }
          : emptySalary,
      )
      setChannel(r.channel)
      setPhase(r.blocked ? 'blocked' : 'read')
    } catch (e) {
      const message = (e as Error).message
      // A bad or private link: say why and let them fix it. Anything else (network,
      // server trouble): fall back to filling the form by hand.
      if (/link|address|port|http|sign in/i.test(message)) {
        setLinkError(message)
        setPhase('idle')
      } else {
        setD(BLANK)
        setSalary(emptySalary)
        setPhase('blocked')
      }
    }
  }

  async function save() {
    const common = { status: target, applied_at: target === 'saved' ? null : localDate(new Date()) }
    if (tab === 'quick') await create.mutateAsync({ role: qt.trim(), company: qc.trim(), ...common })
    else
      await create.mutateAsync({
        role: d.title.trim(),
        company: d.company.trim(),
        // The link is always kept, even when the page couldn't be read.
        job_url: withScheme(url),
        location: d.location.trim() || null,
        work_mode: d.mode || null,
        visa_sponsorship: d.visa,
        source: channel,
        notes: d.notes.trim() || null,
        ...salaryValues(salary),
        ...common,
      })
    onClose()
  }

  return (
    <Dialog
      title="Add a job"
      onClose={onClose}
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!ready || create.isPending} onClick={save}>
            {create.isPending ? 'Adding…' : `Add to ${STATUS_LABEL[target]}`}
          </Button>
        </>
      }
    >
      <Tabs
        items={[
          { value: 'link', label: 'Paste link' },
          { value: 'quick', label: 'Quick add' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'link' ? (
        <>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              fetchPosting()
            }}
          >
            <Input
              id="add-link"
              icon={LinkIcon}
              inputMode="url"
              autoComplete="off"
              placeholder="https://"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setLinkError('')
              }}
              wrapClassName="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={phase === 'loading'}>
              {phase === 'loading' ? 'Reading…' : 'Fetch'}
            </Button>
          </form>
          {linkError && <p className="-mt-2 text-[13px] text-coral-700">{linkError}</p>}
          {reviewing ? (
            <div className="flex flex-col gap-3 rounded-[14px] border border-paper-200 bg-paper-50 p-4">
              {phase === 'read' ? (
                <div className="flex items-center gap-2 text-[13px] font-semibold text-mint-700">
                  <CircleCheck size={16} />
                  Read from the posting. Check and edit anything.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[13px] font-semibold text-blue-700">
                  <Info size={16} />
                  We couldn’t read this page. Fill in the rest.
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                <Input id="add-title" inputSize="sm" label="Job title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} wrapClassName="col-span-full" />
                <Input id="add-company" inputSize="sm" label="Company" value={d.company} onChange={(e) => setD({ ...d, company: e.target.value })} />
                <Input id="add-loc" inputSize="sm" label="Location" value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} />
                <Select id="add-mode" selectSize="sm" label="Work mode" value={d.mode} onChange={(e) => setD({ ...d, mode: e.target.value as WorkMode | '' })} options={MODE_OPTIONS} />
                <SalaryInput id="add-sal" value={salary} onChange={setSalary} />
                <Select
                  id="add-visa"
                  selectSize="sm"
                  label="Visa sponsorship"
                  value={d.visa}
                  onChange={(e) => setD({ ...d, visa: e.target.value as VisaSponsorship })}
                  options={VISA_ADD_OPTIONS}
                  wrapClassName="col-span-full"
                />
                {/* The posting's opening lines, saved as the job's notes. */}
                <TextArea
                  id="add-notes"
                  label="Notes"
                  rows={3}
                  placeholder="Anything worth remembering"
                  value={d.notes}
                  onChange={(e) => setD({ ...d, notes: e.target.value })}
                  wrapClassName="col-span-full"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm leading-normal text-ink-500">Paste a link from LinkedIn, Indeed, Greenhouse, Lever, Workday, or a company site.</p>
          )}
        </>
      ) : (
        <>
          <Input id="qa-title" label="Job title" placeholder="e.g. Product Designer" value={qt} onChange={(e) => setQt(e.target.value)} autoFocus />
          <Input id="qa-company" label="Company" placeholder="e.g. Fernway Health" value={qc} onChange={(e) => setQc(e.target.value)} />
          <p className="text-[13px] text-ink-500">Only title and company are required. Add the rest later from the job card.</p>
        </>
      )}
      {create.error && <p className="text-sm text-coral-700">{create.error.message}</p>}
      <Switch id="add-applied" label="I've already applied" checked={applied} onChange={setApplied} />
    </Dialog>
  )
}
