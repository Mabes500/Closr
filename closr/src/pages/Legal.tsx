import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import PublicFooter from '../components/PublicFooter'
import { LEGAL } from '../lib/legal'

const Email = () => (
  <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-blue-600 hover:underline">
    {LEGAL.contactEmail}
  </a>
)

function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0)
    const before = document.title
    document.title = `${title} · Closr`
    return () => {
      document.title = before
    }
  }, [title])
  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <Link to="/" aria-label="Closr home">
          <Logo size={26} />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 pb-20 pt-8">
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-2 font-mono text-[13px] text-ink-500">Last updated {LEGAL.updated}</p>
        <div className="mt-6 text-base leading-[1.6] text-ink-700">{intro}</div>
        <div className="mt-10 flex flex-col gap-9">{children}</div>
      </main>
      <PublicFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-[15px] leading-[1.65] text-ink-700">
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {children}
    </section>
  )
}

const List = ({ children }: { children: ReactNode }) => <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>
const Term = ({ children }: { children: ReactNode }) => <b className="font-semibold text-ink">{children}</b>

const PROCESSORS: [string, string, string][] = [
  ['Supabase', 'Database and sign-in', 'Your account and everything you keep in Closr'],
  ['Vercel', 'Hosting, reading pasted job links, visit counts', 'Requests to the site, the links you paste, anonymous page views'],
  ['GitHub', 'Runs our scheduled matching and email jobs', 'Profile and job search data while a job runs. Its logs hold counts, not your details'],
  ['Resend', 'Sends notification emails', 'Your email address and the content of each email'],
  ['Sentry', 'Error reports', 'The error, the page address with anything sensitive removed, your browser and system type'],
  ['Google', 'Sign-in, only if you choose it; the DM Mono font', 'Your name and email from Google; your IP address when the font loads'],
  ['Fontshare', 'The General Sans font', 'Your IP address when the font loads'],
  ['Anthropic', 'AI that reads job postings to classify them', 'Public job postings only, never anything about you'],
]

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Closr helps you keep track of your job search. This policy explains what we collect, why, who helps us run the
          service, and the choices you have. "We" means {LEGAL.operator}, which runs heyclosr.app. Questions go to <Email />.
          {LEGAL.postalAddress && ` Our address is ${LEGAL.postalAddress}.`}
        </p>
      }
    >
      <Section title="What we collect">
        <List>
          <li>
            <Term>Your account:</Term> your name, email address and password, which is stored only in scrambled form. If you
            sign in with Google, we get your name and email from Google.
          </li>
          <li>
            <Term>Your profile:</Term> what you tell us about your search, such as target roles, weekly pace, work setups,
            locations, countries you can work in, visa needs, salary floor and ideal start date.
          </li>
          <li>
            <Term>Your job search:</Term> applications, notes, contacts, interviews, reminders, CV version labels, check-in
            answers, spreadsheet rows you import, and how you respond to matched jobs. If you add a contact, such as a
            recruiter, please only add details you are entitled to keep.
          </li>
          <li>
            <Term>Your settings:</Term> appearance, notification choices, quiet hours and check-in time, plus a record of
            which notification emails we have sent you.
          </li>
          <li>
            <Term>Technical information:</Term> error reports when something breaks, and anonymous page view counts.
          </li>
        </List>
        <p>We don't connect to your email inbox, and we don't take payment details.</p>
      </Section>

      <Section title="How we use it">
        <List>
          <li>To run Closr for you: your board, schedule, goals, check-ins and data export.</li>
          <li>To match you with open jobs, based on your profile.</li>
          <li>To send the notification emails you have left switched on.</li>
          <li>
            To show anonymous totals in "People like you", such as where offers came from. These never name anyone and only
            appear when at least 20 people share a target role.
          </li>
          <li>To find and fix problems, keep the service secure, and understand which pages get used.</li>
        </List>
        <p>
          <Term>We don't sell your data, show ads, or use your data to train AI.</Term> Our AI step reads public job postings
          only.
        </p>
        <p>
          If laws such as the GDPR apply to you, our legal bases are: providing the service you asked for (contract), keeping
          it secure and working (legitimate interests), and your choices, such as optional emails (consent).
        </p>
      </Section>

      <Section title="Job links you paste">
        <p>
          When you paste a job link, our server opens that page to fill in the details for you. We never open LinkedIn links;
          you fill those in yourself. If a pasted or imported link points to a company's job board on Greenhouse, Lever or
          Ashby, we add that company to the list of boards we read for everyone. That shared list records the company only,
          not who added it.
        </p>
        <p>When you apply for a job, you do so on the employer's own site, under the employer's own privacy policy.</p>
      </Section>

      <Section title="Who helps us run Closr">
        <p>These companies process data for us, only as needed to provide their part of the service:</p>
        <div className="overflow-x-auto rounded-xl border border-paper-200 bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm leading-[1.45]">
            <thead>
              <tr className="border-b border-paper-200 text-ink">
                {['Company', 'What it does', 'What it handles'].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map(([name, role, data]) => (
                <tr key={name} className="border-b border-paper-200 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{name}</td>
                  <td className="px-4 py-2.5">{role}</td>
                  <td className="px-4 py-2.5">{data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Some of these companies work outside your country, including in the United States. Where the law requires it, we
          rely on the transfer safeguards they offer. We may also share data if the law requires us to.
        </p>
      </Section>

      <Section title="Cookies and browser storage">
        <p>
          We don't use advertising or tracking cookies, and our visit counts don't use cookies at all. Closr saves a few things
          in your browser so it works: your sign-in, your appearance setting, board or list view, and your last import so you
          can undo it.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your data until you delete your account. Deleting it permanently removes your account and everything in it
          from our live database straight away. Copies in our providers' backups and logs, including error reports and email
          records, are removed on those providers' own schedules.
        </p>
      </Section>

      <Section title="Your choices and rights">
        <List>
          <li>
            <Term>See and correct:</Term> everything you entered can be edited in the app.
          </li>
          <li>
            <Term>Download:</Term> Settings → Privacy and data → Export my data.
          </li>
          <li>
            <Term>Delete:</Term> Settings → Privacy and data → Delete account.
          </li>
          <li>
            <Term>Stop emails:</Term> change them in Settings, or use the unsubscribe link in any email.
          </li>
        </List>
        <p>
          Depending on where you live, you may also have the right to ask for a copy of your data, object to or limit how we
          use it, withdraw consent, or complain to your data protection authority. Email <Email /> and we'll help.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Your data is sent over encrypted connections, and database rules stop other users from reading it. No service can
          promise perfect security, so please use a strong password. We'll tell you if a breach affects you, as the law requires.
        </p>
      </Section>

      <Section title="Age limit">
        <p>Closr isn't for anyone under {LEGAL.minimumAge}, and we don't knowingly collect their data.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we'll update the date above. If a change is significant, we'll tell you by email or in the
          app before it takes effect.
        </p>
      </Section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          These terms are the agreement between you and {LEGAL.operator} when you use Closr at heyclosr.app. By creating an
          account or using Closr, you agree to them. Our{' '}
          <Link to="/privacy" className="font-semibold text-blue-600 hover:underline">
            Privacy Policy
          </Link>{' '}
          explains how we handle your data.
        </p>
      }
    >
      <Section title="Using Closr">
        <p>
          Closr is a tool for tracking your job search. You must be at least {LEGAL.minimumAge} to use it. Keep your sign-in
          details safe, give accurate account information, and tell us if you think someone else has got into your account.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          What you put into Closr stays yours. You allow us to store and process it only as needed to run the service for you.
          You are responsible for having the right to add it, including any details about other people.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Please don't:</p>
        <List>
          <li>break the law or use Closr to harm, harass or mislead anyone;</li>
          <li>try to reach other people's data, or get around our security or limits;</li>
          <li>overload the service, or copy its job data in bulk by automated means;</li>
          <li>resell Closr, or upload anything malicious.</li>
        </List>
      </Section>

      <Section title="Job listings and matches">
        <p>
          Job listings come from employers' public job boards, and we use automated tools, including AI, to sort and match them.
          Listings may be out of date, incomplete or wrongly classified, including details such as visa sponsorship, salary or
          remote eligibility. Always check with the employer. We aren't an employer or recruiter, we aren't part of any hiring
          decision, and we can't promise interviews, offers or jobs.
        </p>
      </Section>

      <Section title="Price">
        <p>Closr is free to use today. If we introduce paid features, we'll tell you first, and you won't be charged unless you choose them.</p>
      </Section>

      <Section title="Availability and changes">
        <p>
          We're working to keep Closr running well, but it may sometimes be unavailable, and features may change or end. We
          recommend exporting your data from time to time. If we plan to close the service, we'll aim to give you reasonable
          notice so you can export it.
        </p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can delete your account at any time in Settings. We may suspend or close an account that seriously or repeatedly
          breaks these terms, or where the law requires it.
        </p>
      </Section>

      <Section title="Disclaimer and liability">
        <p>
          Closr is provided "as is" and "as available", without warranties of any kind, as far as the law allows. As far as the
          law allows, we aren't liable for indirect or consequential losses, or for lost opportunities, income or data. Nothing
          in these terms limits rights or liability that the law doesn't allow us to limit, including your rights as a consumer.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we change these terms, we'll update the date above. If a change is significant, we'll tell you by email or in the
          app first. If you keep using Closr after that, the new terms apply; if you don't agree, you can delete your account.
        </p>
      </Section>

      {LEGAL.governingLaw && (
        <Section title="Governing law">
          <p>These terms are governed by the laws of {LEGAL.governingLaw}, without taking away any protection your local consumer law gives you.</p>
        </Section>
      )}

      <Section title="Contact">
        <p>
          Questions about these terms go to <Email />.{LEGAL.postalAddress && ` Our address is ${LEGAL.postalAddress}.`}
        </p>
      </Section>
    </LegalPage>
  )
}
