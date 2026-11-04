import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronRight, CircleCheck, FileSpreadsheet, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Select, Tabs, TopBar } from '../components/ui'
import { useApplications } from '../lib/applications'
import { STAGE_BADGE } from '../lib/board'
import { formatSalary } from '../lib/format'
import {
  FIELD_LABEL,
  IMPORT_FIELDS,
  MAX_ROWS,
  STAGE_CHOICES,
  autoMatch,
  autoStage,
  columnOf,
  detectDateOrder,
  missingRequired,
  parseDate,
  prepareRows,
  statusWords,
  type DateOrder,
  type ImportField,
  type Mapping,
  type Prepared,
  type Sheet,
  type StageChoice,
} from '../lib/importSheet'
import { lastImport, useImportJobs, type LastImport } from '../lib/imports'
import { ACCEPT, readSheetFile, type Workbook } from '../lib/readSheet'
import { CLOSE_REASON_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../lib/types'

const STEPS = ['Choose file', 'Match columns', 'Done']
const FIELD_OPTIONS = [...IMPORT_FIELDS.map((f) => ({ value: f, label: FIELD_LABEL[f] })), { value: '', label: 'Skip this column' }]
const PREVIEW_ROWS = 8

// Dates like 03/04/2026 default to the reader's own convention until the sheet says otherwise.
const localOrder = (): DateOrder => (/^en-(US|PH)|^es-US/.test(navigator.language) ? 'mdy' : 'dmy')

type Done = { importId: string; count: number; byStage: Record<string, number>; skipped: number }

// Prototype `ImportScreen` (roadmap 2.2): choose a .csv/.xlsx/.xls → match columns, map
// status words, check dates and duplicates → import in batches → done, with undo.
export default function Import() {
  const navigate = useNavigate()
  const { data: board = [] } = useApplications()
  const { run, undo } = useImportJobs()
  const fileInput = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [file, setFile] = useState<{ name: string; book: Workbook } | null>(null)
  const [sheetIndex, setSheetIndex] = useState(0)
  const [mapping, setMapping] = useState<Mapping>([])
  const [stages, setStages] = useState<Record<string, StageChoice>>({})
  const [dateOrder, setDateOrder] = useState<DateOrder>(localOrder())
  const [importAnyway, setImportAnyway] = useState<Set<number>>(new Set())
  const [importId, setImportId] = useState(() => crypto.randomUUID())
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [recent, setRecent] = useState<LastImport | null>(lastImport)
  const [notice, setNotice] = useState('')

  const sheet: Sheet | null = file?.book.sheets[sheetIndex]?.sheet ?? null

  // Fresh matches whenever a sheet is chosen.
  function pickSheet(s: Sheet) {
    const m = autoMatch(s)
    setMapping(m)
    const sc = columnOf(m, 'status')
    setStages(sc >= 0 ? Object.fromEntries(statusWords(s, sc).map((w) => [w.key, autoStage(w.word)])) : {})
    const dc = columnOf(m, 'applied_at')
    setDateOrder(dc >= 0 ? detectDateOrder(s.rows.map((r) => r[dc]), localOrder()).order : localOrder())
    setImportAnyway(new Set())
    setImportId(crypto.randomUUID())
  }

  async function onFile(f: File | undefined) {
    if (!f) return
    setError('')
    setNotice('')
    try {
      const book = await readSheetFile(f)
      const first = book.sheets.findIndex((s) => s.sheet.rows.length > 0)
      if (first < 0) return setError('That file has no rows to import.')
      setFile({ name: f.name, book })
      setSheetIndex(first)
      pickSheet(book.sheets[first].sheet)
      setStep(1)
    } catch (e) {
      setError((e as Error).message || 'That file couldn’t be read. Try saving it as .csv.')
    }
  }

  const tooMany = !!sheet && sheet.rows.length > MAX_ROWS
  const words = useMemo(() => (sheet && columnOf(mapping, 'status') >= 0 ? statusWords(sheet, columnOf(mapping, 'status')) : []), [sheet, mapping])
  const dateCol = columnOf(mapping, 'applied_at')
  const dateInfo = useMemo(() => (sheet && dateCol >= 0 ? detectDateOrder(sheet.rows.map((r) => r[dateCol]), localOrder()) : null), [sheet, dateCol])
  const unreadableDates = sheet && dateCol >= 0 ? sheet.rows.filter((r) => String(r[dateCol] ?? '').trim() && !parseDate(r[dateCol], dateOrder)).length : 0

  const prepared = useMemo(
    () =>
      sheet && !tooMany
        ? prepareRows(sheet, { mapping, stages, dateOrder, importId, existing: board.map((a) => ({ company: a.company, role: a.role, job_url: a.job_url })) })
        : [],
    [sheet, tooMany, mapping, stages, dateOrder, importId, board],
  )
  const missing = missingRequired(mapping)
  const duplicates = prepared.filter((r) => r.duplicate && !r.problem)
  const problems = prepared.filter((r) => r.problem)
  const toImport = prepared.filter((r) => !r.problem && (!r.duplicate || importAnyway.has(r.index)))

  function setField(col: number, field: ImportField | '') {
    // A field belongs to one column: picking it here frees it elsewhere.
    const next = mapping.map((f, i) => (i === col ? field || null : f === field ? null : f))
    setMapping(next)
    if (field === 'status' && sheet) setStages(Object.fromEntries(statusWords(sheet, col).map((w) => [w.key, autoStage(w.word)])))
  }

  async function doImport() {
    setError('')
    setProgress({ done: 0, total: toImport.length })
    try {
      await run(toImport, file!.name, (n) => setProgress({ done: n, total: toImport.length }))
      const byStage: Record<string, number> = {}
      for (const r of toImport) byStage[r.values.status] = (byStage[r.values.status] ?? 0) + 1
      setDone({ importId, count: toImport.length, byStage, skipped: prepared.length - toImport.length })
      setRecent(lastImport())
      setStep(2)
    } catch (e) {
      setError(`The import stopped and nothing was added: ${(e as Error).message}`)
    } finally {
      setProgress(null)
    }
  }

  async function undoImport(id: string) {
    try {
      await undo(id)
      setDone(null)
      setFile(null)
      setRecent(null)
      setNotice('Import undone. Those jobs are off your board.')
      setStep(0)
    } catch (e) {
      setError(`Couldn’t undo the import: ${(e as Error).message}`)
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <TopBar title="Import a spreadsheet" />
      <div className="flex max-w-[860px] flex-col gap-4">
        <Stepper step={step} />

        {notice && <p className="rounded-xl bg-mint-100 px-3.5 py-3 text-sm font-medium text-mint-700">{notice}</p>}
        {error && <p className="rounded-xl bg-coral-100 px-3.5 py-3 text-sm font-medium text-coral-700">{error}</p>}

        {step === 0 && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                onFile(e.dataTransfer.files[0])
              }}
              className={`flex flex-col items-center gap-2.5 rounded-[20px] border-2 border-dashed px-6 py-11 text-center transition-colors ${
                dragging ? 'border-blue-400 bg-blue-50' : 'border-paper-400 bg-surface'
              }`}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FileSpreadsheet size={28} />
              </div>
              <b className="text-lg font-semibold text-ink">Bring your spreadsheet</b>
              <span className="text-sm text-ink-500">Drop a CSV or Excel file (.csv, .xlsx, .xls) here, up to {MAX_ROWS.toLocaleString()} rows.</span>
              <Button icon={Upload} className="mt-1.5" onClick={() => fileInput.current?.click()}>
                Choose a file
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  onFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <span className="mt-1 text-xs text-ink-400">
                Using Google Sheets? <b className="font-semibold text-ink-500">File → Download → Comma-separated values (.csv)</b>, then drop it here.
              </span>
            </div>
            {recent && (
              <p className="text-sm text-ink-500">
                You imported {recent.count} jobs from <b className="font-semibold text-ink">{recent.file}</b> recently.{' '}
                <button onClick={() => undoImport(recent.id)} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                  Undo that import
                </button>
              </p>
            )}
          </>
        )}

        {step === 1 && sheet && file && (
          <>
            <div className="flex flex-wrap items-end gap-3 text-sm text-ink-700">
              <span>
                From <b className="font-semibold text-ink">{file.name}</b> · {sheet.rows.length} rows
              </span>
              {file.book.sheets.length > 1 && (
                <Select
                  id="imp-sheet"
                  selectSize="sm"
                  aria-label="Sheet"
                  value={String(sheetIndex)}
                  onChange={(e) => {
                    const i = Number(e.target.value)
                    setSheetIndex(i)
                    pickSheet(file.book.sheets[i].sheet)
                  }}
                  options={file.book.sheets.map((s, i) => ({ value: String(i), label: `Sheet: ${s.name} (${s.sheet.rows.length} rows)` }))}
                />
              )}
            </div>

            {tooMany ? (
              <p className="rounded-xl bg-coral-100 px-3.5 py-3 text-sm font-medium text-coral-700">
                This sheet has {sheet.rows.length.toLocaleString()} rows. Closr imports up to {MAX_ROWS.toLocaleString()} at a time: split it into
                smaller files and import them one by one.
              </p>
            ) : (
              <>
                <p className="text-ink-700">We matched your columns. Change any that look wrong.</p>
                <MapTable
                  head={['Your column', 'Example', 'Closr field']}
                  rows={sheet.headers.map((h, col) => [
                    <Code key="h">{h}</Code>,
                    <span key="e" className="block max-w-[220px] truncate text-ink-500">
                      {String(sheet.rows.find((r) => String(r[col] ?? '').trim())?.[col] ?? '—')}
                    </span>,
                    <Select
                      key="s"
                      id={`imp-col-${col}`}
                      selectSize="sm"
                      aria-label={`Closr field for ${h}`}
                      value={mapping[col] ?? ''}
                      onChange={(e) => setField(col, e.target.value as ImportField | '')}
                      options={FIELD_OPTIONS}
                    />,
                  ])}
                />
                {missing.length > 0 && (
                  <p className="text-sm font-medium text-coral-700">
                    Match {missing.map((f) => FIELD_LABEL[f]).join(' and ')} to a column to continue.
                  </p>
                )}

                {words.length > 0 ? (
                  <>
                    <p className="text-ink-700">Your status words map to stages:</p>
                    <MapTable
                      head={['In your sheet', 'Becomes', 'Rows']}
                      rows={words.map((w) => [
                        <Code key="w">{w.word || '(blank)'}</Code>,
                        <Select
                          key="s"
                          id={`imp-stage-${w.key || 'blank'}`}
                          selectSize="sm"
                          aria-label={`Stage for ${w.word || 'blank'}`}
                          value={stages[w.key] ?? autoStage(w.word)}
                          onChange={(e) => setStages({ ...stages, [w.key]: e.target.value as StageChoice })}
                          options={STAGE_CHOICES}
                        />,
                        <span key="n" className="font-mono">
                          {w.count}
                        </span>,
                      ])}
                    />
                  </>
                ) : (
                  <p className="text-sm text-ink-500">No stage column matched, so every job goes to Applied. You can move them on the board.</p>
                )}

                {dateInfo && (
                  <div className="flex flex-col gap-2">
                    {dateInfo.ambiguous && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-ink-700">Dates like 03/04/2026 mean:</span>
                        <Tabs
                          variant="pill"
                          value={dateOrder}
                          onChange={setDateOrder}
                          items={[
                            { value: 'dmy', label: '3 April (day first)' },
                            { value: 'mdy', label: 'March 4 (month first)' },
                          ]}
                        />
                      </div>
                    )}
                    {dateInfo.ambiguous && (dateInfo.dmy > 0 || dateInfo.mdy > 0) && (
                      <p className="text-xs text-ink-500">
                        Picked {dateInfo.order === 'dmy' ? 'day first' : 'month first'} because {Math.max(dateInfo.dmy, dateInfo.mdy)} of your dates can only be
                        read that way.
                      </p>
                    )}
                    {unreadableDates > 0 && (
                      <p className="text-xs text-gold-800">
                        {unreadableDates} applied {unreadableDates === 1 ? 'date' : 'dates'} couldn’t be read and will be left blank.
                      </p>
                    )}
                  </div>
                )}

                {missing.length === 0 && (
                  <>
                    <p className="text-ink-700">Here’s how the first rows will look:</p>
                    <Preview rows={prepared.slice(0, PREVIEW_ROWS)} />
                    {duplicates.length > 0 && (
                      <Card className="flex flex-col gap-2 p-4">
                        <b className="text-sm font-semibold text-ink">
                          {duplicates.length} likely {duplicates.length === 1 ? 'duplicate' : 'duplicates'}, skipped unless you tick them
                        </b>
                        {duplicates.map((r) => (
                          <label key={r.index} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                            <input
                              type="checkbox"
                              checked={importAnyway.has(r.index)}
                              onChange={(e) => {
                                const next = new Set(importAnyway)
                                if (e.target.checked) next.add(r.index)
                                else next.delete(r.index)
                                setImportAnyway(next)
                              }}
                              className="size-4 accent-blue-600"
                            />
                            <span>
                              Row {r.index}: {r.values.role} at {r.values.company}
                              <span className="text-ink-400"> · {r.duplicate === 'board' ? 'already on your board' : 'appears earlier in this file'}</span>
                            </span>
                          </label>
                        ))}
                      </Card>
                    )}
                    {problems.length > 0 && (
                      <p className="text-sm text-ink-500">
                        {problems.length} {problems.length === 1 ? 'row has' : 'rows have'} no job title or company and will be skipped (row{' '}
                        {problems.map((r) => r.index).join(', ')}).
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {progress ? (
              <div className="flex flex-col gap-2" aria-live="polite">
                <div className="h-2 overflow-hidden rounded-full bg-paper-200">
                  <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
                <span className="font-mono text-xs text-ink-500">
                  Importing {progress.done} of {progress.total}…
                </span>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(0)
                    setFile(null)
                  }}
                >
                  Back
                </Button>
                <span className="flex-1" />
                <Button onClick={doImport} disabled={tooMany || missing.length > 0 || toImport.length === 0}>
                  Import {toImport.length} {toImport.length === 1 ? 'job' : 'jobs'}
                </Button>
              </div>
            )}
          </>
        )}

        {step === 2 && done && (
          <Card className="p-8">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CircleCheck size={44} className="text-mint-600" />
              <h2 className="text-[26px] font-semibold leading-[1.2] text-ink">
                {done.count} {done.count === 1 ? 'job' : 'jobs'} imported
              </h2>
              <p className="text-ink-500">
                {Object.entries(done.byStage)
                  .map(([s, n]) => `${n} ${STATUS_LABEL[s as keyof typeof STATUS_LABEL].toLowerCase()}`)
                  .join(', ')}
                . Your history is on the board.
                {done.skipped > 0 && ` ${done.skipped} ${done.skipped === 1 ? 'row was' : 'rows were'} skipped.`}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button variant="secondary" onClick={() => undoImport(done.importId)}>
                  Undo import
                </Button>
                <Button onClick={() => navigate('/')}>View board</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span className={`flex items-center gap-2 text-[13px] font-semibold ${i <= step ? 'text-ink' : 'text-ink-400'}`}>
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? 'bg-mint-600 text-on-action' : i === step ? 'bg-action text-on-action' : 'bg-paper-200 text-ink-500'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            {s}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={16} className="text-ink-300" />}
        </span>
      ))}
    </div>
  )
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="whitespace-nowrap rounded-md bg-paper-100 px-[7px] py-[3px] font-mono text-[13px]">{children}</code>
)

// Prototype `MapTable`.
function MapTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-paper-200 bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-paper-200 bg-paper-50 px-3.5 py-2.5 text-left text-xs font-semibold text-ink-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, k) => (
                <td key={k} className={`px-3.5 py-2 align-middle text-ink ${i ? 'border-t border-paper-200' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Preview({ rows }: { rows: Prepared[] }) {
  return (
    <MapTable
      head={['Job', 'Stage', 'Applied', 'Salary', 'Source', '']}
      rows={rows.map((r) => {
        const v = r.values
        const badge = STAGE_BADGE[v.status ?? 'applied']
        return [
          <div key="j" className={`min-w-0 ${r.problem || r.duplicate ? 'opacity-50' : ''}`}>
            <div className="truncate font-semibold">{v.role || '—'}</div>
            <div className="truncate text-xs text-ink-500">{[v.company, v.location].filter(Boolean).join(' · ') || '—'}</div>
          </div>,
          <Badge key="s" className={badge.badge} dot={badge.dot}>
            {STATUS_LABEL[v.status ?? 'applied']}
            {v.close_reason && ` · ${CLOSE_REASON_LABEL[v.close_reason]}`}
          </Badge>,
          <span key="a" className="whitespace-nowrap font-mono text-[13px] text-ink-700">
            {v.applied_at ? new Date(`${v.applied_at}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </span>,
          <span key="m" className="whitespace-nowrap font-mono text-[13px]">
            {v.salary_min || v.salary_max ? formatSalary({ salary_min: v.salary_min ?? null, salary_max: v.salary_max ?? null, salary_currency: v.salary_currency ?? null }) : '—'}
          </span>,
          <span key="src" className="text-ink-700">
            {v.source ? SOURCE_LABEL[v.source] : '—'}
          </span>,
          <span key="f" className="whitespace-nowrap text-xs font-semibold">
            {r.problem ? (
              <span className="text-coral-700">{r.problem}</span>
            ) : r.duplicate ? (
              <span className="text-gold-800">Duplicate</span>
            ) : null}
          </span>,
        ]
      })}
    />
  )
}
