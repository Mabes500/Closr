import { useCvVersions } from '../lib/cvVersions'
import { Select } from './ui'

// "CV version sent" picker (prototype drawer `dc-`): your versions in use, plus the job's
// current one if it has since been archived. Renders nothing until you have a version.
export default function CvVersionSelect({
  id,
  value,
  onChange,
  wrapClassName,
}: {
  id: string
  value: string | null
  onChange: (id: string | null) => void
  wrapClassName?: string
}) {
  const { data: versions = [] } = useCvVersions()
  const shown = versions.filter((v) => !v.archived_at || v.id === value)
  if (!shown.length) return null
  return (
    <Select
      id={id}
      selectSize="sm"
      label="CV version sent"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      options={[{ value: '', label: 'Not recorded' }, ...shown.map((v) => ({ value: v.id, label: v.archived_at ? `${v.label} (archived)` : v.label }))]}
      wrapClassName={wrapClassName}
    />
  )
}
