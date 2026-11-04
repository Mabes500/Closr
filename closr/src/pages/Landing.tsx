import { BellRing, ChartNoAxesColumn, KanbanSquare, Link2, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Logo } from '../components/Logo'
import PublicFooter from '../components/PublicFooter'

const columns = [
  { label: 'Applied', dot: 'bg-status-applied', cards: [['Northwind', 'Product Engineer', 'Follow up Thu'], ['Kestrel Pay', 'Backend Engineer', 'Remote']] },
  { label: 'Interviewing', dot: 'bg-status-interviewing', cards: [['Brightpath', 'Senior Developer', 'Interview Tue, 14:00']] },
  { label: 'Offer', dot: 'bg-status-offer', cards: [['Lumen Labs', 'Software Engineer', 'Reply by Fri']] },
]

const features = [
  {
    icon: KanbanSquare,
    title: 'One board for every application',
    body: 'Move each role from Saved to Offer with a drag. Every change is timed and recorded for you, with no formulas or lost tabs.',
  },
  {
    icon: Link2,
    title: 'Add jobs in seconds',
    body: 'Paste a job link and the details fill themselves in, or bring your whole spreadsheet across in a few clicks.',
  },
  {
    icon: Sparkles,
    title: 'Matching jobs every day',
    body: 'New openings from company career pages, matched to your target roles, the countries you can work in and your visa needs.',
  },
  {
    icon: BellRing,
    title: 'Never miss a follow-up',
    body: 'Keep interviews, follow-ups and deadlines on one schedule, with reminders in Closr and by email.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Check-ins on quiet applications',
    body: 'When an application has been quiet for a week, one tap records what happened and can set your next follow-up.',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'See what is working',
    body: 'Set a weekly goal, keep your streak, and see which sources and CV versions actually get you responses.',
  },
]

export default function Landing() {
  // Signed-in visitors skip sign-up and log-in and go straight to the board.
  const { session } = useAuth()
  const start = session ? '/' : '/signup'
  const logIn = session ? '/' : '/login'
  return (
    <div className="min-h-full bg-paper-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <Logo size={26} />
        <div className="flex items-center gap-4 text-sm">
          <Link to={logIn} className="font-semibold text-ink-700 hover:text-ink">
            Log in
          </Link>
          <Link to={start} className="rounded-xl bg-action px-4 py-2 font-semibold text-on-action hover:bg-action-hover">
            Get started free
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center sm:pt-20">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-800">
          <span className="size-1.5 shrink-0 rounded-full bg-spark" />
          For people applying to remote and international roles
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-[42px] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[64px]">
          Apply widely.
          <br />
          <span className="text-blue-600">Stay on top of it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-normal text-ink-500">
          Closr keeps every application, interview and follow-up in one place, finds new jobs that fit, and shows you what's
          working.
        </p>
        <div className="mt-8">
          <Link to={start} className="inline-block rounded-xl bg-action px-6 py-3 font-semibold text-on-action hover:bg-action-hover">
            Start tracking, it's free
          </Link>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-[20px] border border-paper-200 bg-surface p-3 text-left shadow-sm sm:p-5" aria-label="Example board" role="img">
          <div className="grid gap-3 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.label} className="rounded-2xl bg-paper-50 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`size-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-ink">{col.label}</span>
                  <span className="font-mono text-xs text-ink-500">{col.cards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.cards.map(([company, role, note]) => (
                    <div key={company} className="rounded-xl border border-paper-200 bg-surface p-3">
                      <p className="text-sm font-semibold text-ink">{role}</p>
                      <p className="text-[13px] text-ink-500">{company}</p>
                      <p className="mt-2 font-mono text-xs text-ink-500">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-paper-200 bg-surface">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-12 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
              <p className="mt-2 text-[15px] leading-normal text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[28px] bg-oxford-900 px-6 py-12 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white">Your next offer is in the pipeline.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/75">Set up your board in about a minute. Free while you search.</p>
          <Link to={start} className="mt-8 inline-block rounded-xl bg-spark px-6 py-3 font-semibold text-on-spark hover:brightness-95">
            Get started free
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
