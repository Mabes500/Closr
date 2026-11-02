import { INTERVIEW_ORIGINS, INTERVIEW_ORIGIN_LABEL, type Application, type JobChannel } from '../lib/types'
import { Button, Dialog } from './ui'

// Prototype `ChannelModal`: asked when a job moves to Interviewing, if not answered yet.
// The prototype says answers are anonymous and shape other people's plans; nothing is
// shared across users yet (roadmap 5.3), so the copy says it stays private instead.
export default function ChannelModal({
  app,
  onPick,
  onClose,
}: {
  app: Application
  onPick: (origin: JobChannel) => void
  onClose: () => void
}) {
  return (
    <Dialog
      title="What got you this interview?"
      description={`${app.company} · One tap. It stays private and sharpens your plan.`}
      onClose={onClose}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
        {INTERVIEW_ORIGINS.map((o, i) => (
          <Button key={o} variant="secondary" autoFocus={i === 0} onClick={() => onPick(o)}>
            {INTERVIEW_ORIGIN_LABEL[o]}
          </Button>
        ))}
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Skip
        </Button>
      </div>
    </Dialog>
  )
}
