# Jobs feed plan (roadmap Phase 6)

Goal: every morning, each user sees a short list of fresh, relevant openings ("Today's matches") with the reasons each one fits, and can save a match to their board in one tap. Matches the prototype's `JobsScreen`, `FeedCard`, `PostingPage`.

## 1. Sources

Rule: only use data that employers or boards publish for others to read, and always send the user to the original posting to apply.

**Version 1: employer ATS job boards**

| Source | Endpoint | Notes |
|---|---|---|
| Greenhouse | `GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` | Public, no key. Poll on a schedule, not per page view. |
| Lever | `GET api.lever.co/v0/postings/{site}?mode=json` | Public, no key. EU-hosted boards answer on `api.eu.lever.co`. Includes workplace type. |
| Ashby | `GET api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true` | Public, no key. Skip jobs where `isListed` is false. Salary bands are published more often than elsewhere. |

These are the feeds employers' own career pages use, so they are first-party, current, and include direct apply links. Greenhouse, Lever and Ashby are heavily used by tech companies and scale-ups, which fits Closr's first users. Coverage of non-tech fields will be thinner; see Later sources.

**Excluded**

- LinkedIn, Indeed, Glassdoor: their terms prohibit automated collection. Do not scrape.
- Remotive: its terms forbid using its listings to collect sign-ups, which is how Closr works.
- Himalayas: its terms restrict passing jobs on to other aggregators.
- Adzuna: commercial use needs a paid licence after a 14-day trial. Revisit once there's revenue; it would add broad non-tech and UK/EU coverage.

**Later sources (verify each one's terms before adding)**

Other ATS public boards (Workable, SmartRecruiters, Recruitee, Personio), Remote OK (requires attribution and a link back), government job APIs (e.g. USAJobs). Workday has no official public jobs API; skip.

## 2. Knowing which companies to read

The ATS APIs return one company per call and can't list all their customers, so Closr keeps its own registry of boards.

Table `job_boards`: ats, slug, company name, company domain, active, last_fetched_at, last_job_count, consecutive_failures.

Filling it:
1. **Starter list.** A curated seed of a few thousand Greenhouse, Lever and Ashby slugs, validated by calling each API and keeping only boards with at least one open job.
2. **Flywheel.** Every link a user pastes or imports from greenhouse.io, lever.co or ashbyhq.com registers that company's board automatically. Coverage grows with use and follows what Closr users actually apply to.
3. **Pruning.** Boards with zero jobs or repeated errors for 14 days are marked inactive and rechecked weekly.

## 3. Pipeline

Runs once a day as a **GitHub Actions scheduled workflow** (free, long runtime, visible logs, no extra tools for the owner). It uses the Supabase service-role key stored as a GitHub secret, never in the app.

1. **Fetch.** Read every active board, a few at a time with polite pacing and an honest user agent. Retry once, then record the failure.
2. **Normalise.** Map each ATS's fields to one `job_postings` shape: source, external id, company, title, location text, countries, work mode, salary min/max/currency/period, description (plain text, emails and phone numbers stripped), apply URL, posted_at, first_seen_at, last_seen_at, closed_at.
3. **Upsert and close.** New postings are inserted; existing ones update `last_seen_at`; postings missing from their board are marked closed.
4. **Enrich (new postings only).** Fill gaps that rules can't: role category and catalogue title (from `src/data/roles.ts`), seniority, visa sponsorship (yes / no / not stated), time zone or region restrictions, remote eligibility by country. Rules first, using what the ATS already provides; then a small, cheap AI model (Claude Haiku) reads the description for whatever is still unknown. Only postings in role categories at least one user targets are enriched, to keep cost down. Requires an Anthropic API key with billing.
5. **Match** (section 4).

`job_postings` is shared reference data: readable by any signed-in user, writable only by the pipeline.

## 4. Matching

Per user, daily, from postings first seen in the last 14 days and still open:

| Signal | From the profile | Rule |
|---|---|---|
| Role | target roles | Must match a target role's title, aliases or category |
| Work setup | remote / hybrid / onsite | Must allow at least one selected setup |
| Location | locations | Onsite and hybrid must be in or near a chosen location; remote must be open to the user's country or region |
| Visa | needs sponsorship (new profile field) | If yes, hide postings that say no sponsorship; rank "sponsors visa" higher |
| Salary | salary floor + currency | Hide only if the posting states a maximum below the floor; unknown salary is allowed |
| Freshness | — | Newer ranks higher |

Exclude jobs already on the user's board and anything dismissed. Keep the top 10–20 as today's matches.

Table `job_matches`: user, posting, score, reasons (short labels shown on the card, e.g. "Sponsors visa", "Open to your time zone", "Matches Backend engineer"), status (new / saved / dismissed), created_at. RLS: each user sees only their own matches.

## 5. App

- **Jobs screen**: "Today's matches" with reason chips, filters from the prototype, the empty states "Finding your first matches" (new users) and "You've been through today's matches".
- **Save to board**: creates an application in Saved, with company, title, link, location, work mode, salary and visa filled in and source "Job board".
- **Not for me**: dismiss, with an optional reason that feeds future ranking.
- **Posting page**: details and "Apply on company site" (always the employer's own link).
- **Closed postings**: a saved job whose posting closes shows "This posting has closed".
- **Notification**: "N new matches today" in the bell. Email digest comes with 7.2.
- **Profile**: add "Needs visa sponsorship" (yes / no) and "Countries I can work in" so matching is accurate.

## 6. Build order (one Claude Code task each)

1. **6.2a Data pipeline**: `job_boards`, `job_postings` tables and RLS, fetchers for the three ATSs, normaliser, the GitHub Actions workflow, starter list loader, flywheel registration from paste-link and import. Done when a run fills `job_postings` and the logs show counts per source.
2. **6.2b Enrichment**: rules plus Haiku pass for new postings, with a per-run cost cap and a dry-run mode.
3. **6.2c Matching**: profile fields, scoring, `job_matches`, reasons.
4. **6.2d Jobs UI**: Jobs screen, posting page, save, dismiss, closed state, bell notification.

## 7. Related fix

The paste-link function (2.1) currently tries to fetch LinkedIn pages. To stay consistent with the rule above, LinkedIn links should skip the fetch: save the link and ask the user to fill in the title and company.

## 8. Success measures

At launch: at least 2,000 active boards; at least 10 matches a day for a typical tech profile; under 5% of saved matches already closed when saved. After launch, track saves per match shown and dismiss reasons to tune ranking.
