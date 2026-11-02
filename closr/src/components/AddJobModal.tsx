import { useState } from 'react'
import { Info, Link as LinkIcon } from 'lucide-react'
import { useCreateApplication } from '../lib/applications'
import { localDate } from '../lib/stats'
import { STATUS_LABEL, VISA_LABEL, type ApplicationStatus, type VisaSponsorship, type WorkMode } from '../lib/types'
import SalaryInput, { emptySalary, salaryValues, type SalaryDraft } from './SalaryInput'
import { Button, Dialog, Input, Select, Switch, Tabs } from './ui'

type Tab = 'link' | 'quick'

const MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
]
const VISA_ADD_OPTIONS = (['unknown', 'yes', 'no', 'not_needed'] as const).map((v) => ({
  value: v,
  label: v === 'unknown' ? 'Unknown (not stated)' : VISA_LABEL[v],
}))

// Prototype `AddJobModal`. "Paste link" can't read postings yet (roadmap 2.1), so
// "Fetch" opens the same review form empty for the user to fill in. Only title and
// company are required. `column` is the board column the user added from, if any.
export default function AddJobModal({ column, onClose }: { column?: ApplicationStatus; onClose: () => void }) {
  const create = useCreateApplication()
  const [tab, setTab] = useState<Tab>('link')
  const [url, setUrl] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [applied, setApplied] = useState(column !== 'saved')
  const [d, setD] = useState({ title: '', company: '', location: '', mode: 'remote' as WorkMode, visa: 'unknown' as VisaSponsorship })
  const [salary, setSalary] = useState<SalaryDraft>(emptySalary)
  const [qt, setQt] = useState('')
  const [qc, setQc] = useState('')

  // "I've already applied" picks Applied (or the later column it was opened from); off means Saved.
  const target: ApplicationStatus = !applied ? 'saved' : column && column !== 'saved' ? column : 'applied'
  const ready = tab === 'quick' ? qt.trim() && qc.trim() : reviewing && d.title.trim() && d.company.trim()

  async function save() {
    const common = { status: target, applied_at: target === 'saved' ? null : localDate(new Date()) }
    if (tab === 'quick') await create.mutateAsync({ role: qt.trim(), company: qc.trim(), ...common })
    else
      await create.mutateAsync({
        role: d.title.trim(),
        company: d.company.trim(),
        job_url: url.trim() || null,
        location: d.location.trim() || null,
        work_mode: d.mode,
        visa_sponsorship: d.visa,
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
              setReviewing(true)
            }}
          >
            <Input
              id="add-link"
              icon={LinkIcon}
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              wrapClassName="flex-1"
              autoFocus
            />
            <Button type="submit">Fetch</Button>
          </form>
          {reviewing ? (
            <div className="flex flex-col gap-3 rounded-[14px] border border-paper-200 bg-paper-50 p-4">
              {/* Stub until roadmap 2.1: nothing is read from the posting yet. */}
              <div className="flex items-center gap-2 text-[13px] font-semibold text-blue-700">
                <Info size={16} />
                Reading postings automatically is coming soon. Fill in what you know.
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                <Input id="add-title" inputSize="sm" label="Job title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} wrapClassName="col-span-full" />
                <Input id="add-company" inputSize="sm" label="Company" value={d.company} onChange={(e) => setD({ ...d, company: e.target.value })} />
                <Input id="add-loc" inputSize="sm" label="Location" value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} />
                <Select id="add-mode" selectSize="sm" label="Work mode" value={d.mode} onChange={(e) => setD({ ...d, mode: e.target.value as WorkMode })} options={MODE_OPTIONS} />
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
