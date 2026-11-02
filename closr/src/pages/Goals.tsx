import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { ProgressRing, StreakDots } from '../components/Progress'
import { Card, IconButton, TopBar } from '../components/ui'
import { PACE_ORDER, useWeekProgress } from '../lib/goals'
import { useUpdateProfile } from '../lib/profile'

// Prototype `GoalsScreen`.
export default function Goals() {
  const p = useWeekProgress()
  const updateProfile = useUpdateProfile()
  if (!p.loaded) return null

  // Raise/lower steps through the paces: 2, 5, 10 a week.
  const i = PACE_ORDER.indexOf(p.pace)
  const setPace = (step: number) => updateProfile.mutate({ weekly_pace: PACE_ORDER[i + step] })

  return (
    <div className="flex max-w-[1000px] flex-col gap-4">
      <TopBar title="Goals" />

      <Eyebrow>Your progress</Eyebrow>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <Card className="p-6">
          <Eyebrow>Weekly applications</Eyebrow>
          <div className="mt-3.5 flex items-center gap-5">
            <ProgressRing value={p.applied} max={p.target} size={104} stroke={10} />
            <div>
              <div className="text-4xl font-semibold leading-none text-ink">
                {p.applied}
                <span className="text-lg text-ink-500">/{p.target}</span>
              </div>
              <div className="mt-1 text-[13px] text-ink-500">this week</div>
              <div className="mt-2.5 flex items-center gap-2">
                <StepButton icon={Minus} label="Lower weekly target" disabled={i <= 0} onClick={() => setPace(-1)} />
                <span className="text-xs font-medium text-ink-500">Target</span>
                <StepButton icon={Plus} label="Raise weekly target" disabled={i >= PACE_ORDER.length - 1} onClick={() => setPace(1)} />
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <Eyebrow>Consistency</Eyebrow>
          <div className="my-3.5 flex flex-col gap-1.5">
            <b className="text-4xl font-semibold leading-none text-ink">
              {p.streak} day{p.streak === 1 ? '' : 's'}
            </b>
            <span className="text-[13px] leading-[1.45] text-ink-500">
              {p.streak
                ? 'active streak. Adding jobs, moving them, notes, reminders and check-ins all count.'
                : 'Add a job or finish a plan step today to start a streak.'}
            </span>
          </div>
          <StreakDots streak={p.streak} activeToday={p.activeToday} />
        </Card>
      </div>
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-500">{children}</div>
}

// Outline icon button for the target (prototype IconButton variant="outline" size="sm").
function StepButton({ disabled, ...rest }: { icon: typeof Plus; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <span className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <IconButton {...rest} className="size-8 border-[1.5px] border-paper-300" />
    </span>
  )
}
