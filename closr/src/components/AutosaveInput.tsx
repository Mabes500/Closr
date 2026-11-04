import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Input } from './ui'

// Text box that saves 600ms after typing stops, on leaving the box, and (if an edit is
// still waiting) when the page is left.
export default function AutosaveInput({
  saved,
  onSave,
  ...rest
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'> & { saved: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(saved)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const last = useRef(saved)
  const latest = useRef({ value: saved, onSave })
  latest.current = { value, onSave }
  const flush = () => {
    clearTimeout(timer.current)
    const { value: v, onSave: save } = latest.current
    if (v === last.current) return
    last.current = v
    save(v)
  }
  useEffect(() => flush, [])
  return (
    <Input
      {...rest}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        clearTimeout(timer.current)
        timer.current = setTimeout(flush, 600)
      }}
      onBlur={flush}
    />
  )
}
