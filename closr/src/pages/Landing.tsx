import { Link } from 'react-router-dom'
import { Logo, Mark } from '../components/Logo'

const columns = [
  { label: 'Applied', color: 'var(--color-status-applied)', cards: [['Northwind', 'Product Engineer'], ['Kestrel Pay', 'Backend Engineer']] },
  { label: 'Interviewing', color: 'var(--color-status-interviewing)', cards: [['Brightpath', 'Senior Developer']] },
  { label: 'Offer', color: 'var(--color-status-offer)', cards: [['Lumen Labs', 'Software Engineer']] },
]

const features = [
  {
    title: 'One board for every application',
    body: 'Add a role in seconds and drag it from Applied to Offer. No spreadsheet, no formulas, no lost tabs.',
  },
  {
    title: 'A timeline that writes itself',
    body: 'Every status change is recorded automatically, so you always know when you applied and how long they have been quiet.',
  },
  {
    title: 'Numbers that tell you what works',
    body: 'See your response rate and which sources actually lead to interviews, then spend your time there.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-full bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo size={26} />
        <div className="flex items-center gap-3 text-sm">
          <Link to="/login" className="font-medium text-ink-muted hover:text-ink">
            Sign in
          </Link>
          <Link to="/login" className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-hover">
            Get started free
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 text-center sm:pt-20">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-spark-soft px-3 py-1 text-xs font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-spark" />
          For job seekers applying to remote and international roles
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Apply widely.<br />
          <span className="text-brand">Stay on top of it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-muted">
          Closr keeps every application, interview and follow-up in one place, so you spend less time tracking and more
          time closing offers.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/login" className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-hover">
            Start tracking, it's free
          </Link>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-line bg-canvas p-4 text-left shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.label} className="rounded-xl border border-line bg-surface/70 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="font-mono text-xs text-ink-faint">{col.cards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.cards.map(([company, role]) => (
                    <div key={company} className="rounded-lg border border-line bg-surface p-3 shadow-sm">
                      <p className="text-sm font-semibold">{company}</p>
                      <p className="text-sm text-ink-muted">{role}</p>
                      <span className="mt-2 inline-block rounded bg-canvas px-1.5 py-0.5 text-xs text-ink-faint">Remote</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-ink px-8 py-12 text-center sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Your next offer is in the pipeline.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/70">
            Set up your board in under a minute. Coming soon: goals with next-step recommendations based on what worked
            for people in your field.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-block rounded-lg bg-spark px-6 py-3 font-medium text-ink hover:brightness-95"
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-ink-faint">
          <span className="inline-flex items-center gap-2">
            <Mark size={18} /> © {new Date().getFullYear()} Closr
          </span>
          <Link to="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
