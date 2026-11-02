import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarCheck,
  CalendarClock,
  FileText,
  Settings,
  Target,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { Card, EmptyState, TopBar } from '../components/ui'

// Placeholder for app-shell screens that aren't built yet (see docs/ROADMAP.md).
const SCREENS: Record<string, { title: string; icon: LucideIcon; body: string }> = {
  jobs: { title: 'Jobs', icon: Briefcase, body: 'Daily job matches based on your roles, location and visa needs.' },
  goals: { title: 'Goals', icon: Target, body: 'A weekly target, your streak, and what is working in your search.' },
  checkins: { title: 'Check-ins', icon: CalendarCheck, body: 'Quick check-ins on applications that have gone quiet.' },
  schedule: { title: 'Schedule', icon: CalendarClock, body: 'Interviews, follow-ups and deadlines in one list, with reminders.' },
  cv: { title: 'CV versions', icon: FileText, body: 'Label each CV you send and see which one gets replies.' },
  import: { title: 'Import', icon: Upload, body: 'Bring your jobs over from a spreadsheet in a few clicks.' },
  settings: { title: 'Settings', icon: Settings, body: 'Account, password, appearance, notifications and your data.' },
}

export default function ComingSoon({ screen }: { screen: keyof typeof SCREENS }) {
  const s = SCREENS[screen]
  return (
    <div className="flex flex-col gap-6">
      <TopBar title={s.title} />
      <Card>
        <EmptyState icon={s.icon} title="Coming soon" body={s.body}>
          {/* Until Schedule exists (Phase 3), interviews keep their own page. */}
          {screen === 'schedule' && (
            <Link
              to="/interviews"
              className="inline-flex h-10 items-center rounded-xl bg-oxford-900 px-[18px] text-[15px] font-semibold text-white hover:bg-oxford-800"
            >
              See your interviews
            </Link>
          )}
        </EmptyState>
      </Card>
    </div>
  )
}
