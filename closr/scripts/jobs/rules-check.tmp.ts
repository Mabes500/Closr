// TEMPORARY, not committed: how much the rules fill on real boards.
import { fetchBoard, normalise, type Ats } from './ats.ts'
import { enrichByRules, gaps, matchRole, seniorityFrom, visaFrom } from './rules.ts'

const boards: [Ats, string][] = [['greenhouse', 'stripe'], ['greenhouse', 'airbnb'], ['lever', 'palantir'], ['ashby', 'ramp'], ['ashby', 'linear'], ['ashby', 'notion'], ['greenhouse', 'duolingo'], ['ashby', 'deel']]
let n = 0, role = 0, sen = 0, visa = 0, visaNo = 0, visaYes = 0, noGap = 0
const unmatched: string[] = []
for (const [ats, slug] of boards) {
  try {
    const { raw, region } = await fetchBoard({ ats, slug, region: null })
    for (const p of normalise(raw, { id: '', ats, slug, region, company_name: null })) {
      const e = enrichByRules(p)
      n++
      if (e.role_category) role++
      else if (unmatched.length < 40) unmatched.push(p.title)
      if (e.seniority) sen++
      if (e.visa_sponsorship) visa++
      if (e.visa_sponsorship === 'no') visaNo++
      if (e.visa_sponsorship === 'yes') visaYes++
      if (!gaps(e, p.work_mode).length) noGap++
    }
  } catch (e) {
    console.log(slug, (e as Error).message)
  }
}
const pc = (x: number) => `${x} (${Math.round((x / n) * 100)}%)`
console.log({ postings: n, role: pc(role), seniority: pc(sen), visa: pc(visa), visaNo, visaYes, complete: pc(noGap) })
console.log('\nUnmatched titles:\n ' + unmatched.join('\n '))
console.log('\nSamples:')
for (const t of ['Senior Software Engineer, Payments', 'Software Engineer II', 'Staff Machine Learning Engineer', 'Account Executive, Mid-Market', 'Product Designer', 'Head of Sales, EMEA', 'Engineering Manager - Infra', 'Associate Product Manager', 'Data Scientist (Remote)', 'SWE Intern 2027', 'Frontend Developer', 'Recruiter'])
  console.log(' ', t, '→', JSON.stringify(matchRole(t)), seniorityFrom(t))
for (const d of ['We are unable to sponsor visas for this role.', 'Visa sponsorship is available for this position.', 'Applicants must be authorized to work in the US without the need for visa sponsorship.', 'We offer relocation and visa support.', 'Great team.'])
  console.log(' ', JSON.stringify(d), '→', visaFrom(d))
