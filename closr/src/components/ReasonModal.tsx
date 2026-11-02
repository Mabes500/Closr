import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CLOSE_REASONS, CLOSE_REASON_LABEL, type Application, type CloseReason } from '../lib/types'

// Asked whenever an application moves to Closed (prototype `ReasonModal`).
// Closing the dialog without picking leaves the application where it was.
export default function ReasonModal({
  app,
  onPick,
  onClose,
}: {
  app: Application
  onPick: (reason: CloseReason) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay p-6 backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[480px] flex-col gap-[18px] rounded-[28px] bg-white p-7 shadow-dialog"
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <h3 id="reason-title" className="text-[22px] font-bold leading-[1.25] tracking-[-0.02em] text-ink">
              Close {app.company}?
            </h3>
            <p className="text-[15px] leading-normal text-ink-500">Pick a reason. It stays private and sharpens your plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="-mr-1.5 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-paper-100 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CLOSE_REASONS.map((r, i) => (
            <button
              key={r}
              type="button"
              autoFocus={i === 0}
              onClick={() => onPick(r)}
              className="inline-flex h-10 items-center justify-center rounded-xl border-[1.5px] border-paper-300 bg-white px-[18px] text-[15px] font-semibold text-ink transition-[background,border-color,transform] hover:border-ink-300 hover:bg-paper-50 focus-visible:shadow-[0_0_0_3px_var(--color-focus)] focus-visible:outline-none active:scale-[.97]"
            >
              {CLOSE_REASON_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
