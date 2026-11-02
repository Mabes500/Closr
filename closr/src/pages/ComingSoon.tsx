import { Briefcase, CalendarCheck, Settings, Target, type LucideIcon } from 'lucide-react'
import { Card, EmptyState, TopBar } from '../components/ui'

// Placeholder for app-shell screens that aren't built yet (see docs/ROADMAP.md).
const SCREENS: Record<string, { title: string; icon: LucideIcon; body: string }> = {
  jobs: { title: 'Jobs', icon: Briefcase, body: 'Daily job matches based on your roles, location and visa needs.' },
  goals: { title: 'Goals', icon: Target, body: 'A weekly target, your streak, and what is working in your search.' },
  checkins: { title: 'Check-ins', icon: CalendarCheck, body: 'Quick check-ins on applications that have gone quiet.' },
  settings: { title: 'Settings', icon: Settings, body: 'Account, password, appearance, notifications and your data.' },
}

export default function ComingSoon({ screen }: { screen: keyof typeof SCREENS }) {
  const s = SCREENS[screen]
  return (
    <div className="flex flex-col gap-6">
      <TopBar title={s.title} />
      <Card>
        <EmptyState icon={s.icon} title="Coming soon" body={s.body} />
      </Card>
    </div>
  )
}
