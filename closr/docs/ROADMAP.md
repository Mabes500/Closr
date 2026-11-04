# Closr roadmap

Source of truth for what to build: `docs/prototype.html` (final prototype). This file turns it into an ordered build plan. Build one item at a time, ship it, then tick it here.

## Using the prototype

`docs/prototype.html` is a single-file React prototype (~530 KB, mostly embedded fonts). Do not read it whole. Search it for the screen you are building and read that function. Screen-to-function map:

| Screen | Prototype function / constant |
|---|---|
| Sign up, log in, forgot/reset password | `SignupScreen`, `LoginScreen`, `ForgotScreen`, `SentScreen`, `ResetScreen`, `AuthShell` |
| Onboarding | `Onboarding`, `OB_STEPS`, `OB_SUGGEST`, `PACES` |
| App shell and nav | `AppShell`, `Sidebar`, `TopBar`, `NAV` |
| Board | `BoardScreen`, `JobCard`, `ListView`, `StageStepper` |
| Job detail | `JobDrawer`, `JobPage`, `ReasonModal` |
| Add job | `AddJobModal` (quick add + paste link) |
| Jobs feed | `JobsScreen`, `FeedCard`, `PostingPage`, `FEED` |
| Goals | `GoalsScreen`, `ProgressRing`, `StreakDots` |
| Check-ins | `CheckinsScreen` |
| Schedule and reminders | `ScheduleScreen`, `ScheduleDialog`, `ReminderRow`, `REM_TYPES` |
| CV versions | `CvScreen`, `CVS` |
| Spreadsheet import | `ImportScreen`, `MapTable` |
| Profile | `ProfileScreen` |
| Settings | `SettingsScreen` |
| Notifications | `NotificationPanel`, `NOTIF_KIND` |
| Sample data | `DEMO_USER`, `J` (jobs), `seedReminders` |

Match the prototype's layout, copy, and empty states. Where the prototype simulates something (file upload, link reading, job matching), build the real version or leave a clearly marked stub.

## Already built (pre-alignment)
Board with drag-and-drop, job detail drawer, event timeline, dashboard stats, interviews, contacts, landing page, Google sign-in. Some of this diverges from the prototype and is corrected in Phase 0.

## Phase 0: Align foundations
Do these first; everything later depends on them.

- [x] **0.1 Auth.** Email + password sign-up, log in, forgot password, reset password (prototype auth screens, including password strength hint). Keep "Continue with Google" on both sign-up and log in. Remove the magic-link form. Supabase handles reset emails.
- [x] **0.2 Stages.** Stages become Saved, Applied, Interviewing, Offer, Closed. Closed requires a reason: Rejected, No response, Withdrew, Declined offer (`ReasonModal`). Migrate existing `rejected` rows to `closed` with reason `rejected`. Closed cards show the reason and are dimmed.
- [x] **0.3 Job fields.** Add to applications: time zone, visa sponsorship (yes / no / not needed / unknown), salary min and max with currency, source (LinkedIn or X post, Job board, Company career page, Referral, Recruiter reached out, Community, Other), interview origin ("What got you this interview?"), next action. Update add-job and the drawer to match `AddJobModal` and `JobDrawer`.
- [x] **0.4 App shell.** Sidebar nav from `NAV`: Board, Jobs, Goals, Check-ins, Schedule, CV Versions, Spreadsheet Import; Profile and Settings in the user menu. Mobile layout per prototype. Screens not built yet show a simple "coming soon" placeholder.
- [x] **0.5 Reconcile built work.** Contacts move inside the job drawer (no Contacts page in nav; keep the table). The Interviews page folds into Schedule (Phase 3). Keep the stats only where the prototype shows them.

## Phase 1: Onboarding and profile
- [x] **1.1 Profile fields.** Add to profiles: search stage (starting / applying / interviewing / browsing), target roles (list), weekly pace (ease 2 / steady 5 / push 10), work setups, locations, salary floor and currency, ideal start, `onboarded_at`.
- [x] **1.2 Onboarding flow.** Four steps after first sign-up: where you are, roles (chips with suggestions), weekly pace, how to start (import spreadsheet / paste a job link / empty board). Progress bar, back, skip step, skip all, Enter to continue, "You're all set" screen. New users without `onboarded_at` go here; the final choice routes to Import, Add job, or Board.
- [x] **1.3 Profile screen.** Edit everything from onboarding plus location, salary floor, ideal start. Autosave. "Redo onboarding".

## Phase 2: Getting jobs in
- [x] **2.1 Paste a job link.** Server function (Vercel serverless function `api/parse-job.ts`, signed-in users only) fetches the posting and pre-fills title, company, location, work mode, salary where available. User reviews before saving. Quick add stays: only title and company required.
- [x] **2.2 Spreadsheet import.** Upload CSV or XLSX, auto-match columns to Closr fields with manual override, map the user's status words to stages, preview, import, undo import.

## Phase 3: Schedule and reminders
- [x] **3.1 Reminders.** Reminders table with types Follow up, Interview, Deadline, Reminder (`REM_TYPES`), linked to a job, with due time, done, snooze. Existing interviews migrate in.
- [x] **3.2 Schedule screen.** Overdue, today, later this week, later; filter by type; mark done; snooze. Next reminder chip on board cards. Replaces the old Contacts "Follow up" list; the drawer's "Follow up" badge should link to the reminder.
- [x] **3.3 In-app notifications.** Bell + panel (`NotificationPanel`): interviews, overdue follow-ups, deadlines, check-ins, streaks. Read/unread. Includes the notification bell, which the prototype puts in the Sidebar header and the mobile top bar (deferred from 0.4, done). Built: interviews within 24h, follow-ups due or overdue, deadlines within 24h or overdue, created when the app loads. Check-in and streak notifications arrive with those features (Phase 4 and 5.1); email with 7.2.

## Phase 4: Check-ins and CV versions
- [x] **4.1 CV versions.** Label each CV/résumé version; pick the version when adding or editing a job; show response rate per version.
- [x] **4.2 Check-ins.** For applications quiet 7+ days, ask "how is it going": No reply yet / Interview / Rejected. One-tap answers update the stage; "No reply yet" offers a follow-up reminder.

## Phase 5: Goals
- [x] **5.1 Weekly target and streak.** Target from weekly pace; raise/lower; streak of days the user touched their search. Includes the streak card in Sidebar (deferred from 0.4, done).
- [x] **5.2 Goals screen.** Your plan this week, progress ring, consistency, what's working from the user's own data (sources, CV versions, response rates). Reuse `src/lib/stats.ts` from the old board stats strip (removed in 0.5). Decided: a response is reaching Interviewing or Offer, or closing as Rejected (as in the prototype); the same rule is used on CV Versions.
- [x] **5.3 "People like you".** Where offers came from for similar users. Built with real data only: a database function (`people_like_you`) returns anonymous totals for users sharing a target role, only when at least 20 of them exist (sources used by fewer than 5 fold into "Other"); otherwise Goals says "This fills in as more people in your field use Closr." No sample data is shown.

## Phase 6: Jobs feed
The plan is in [docs/JOBS-FEED-PLAN.md](JOBS-FEED-PLAN.md): sources and what's excluded, the board registry, the daily pipeline, matching, and the app. Build in this order, one task each.

- [x] **6.1 Plan.** Done: docs/JOBS-FEED-PLAN.md. Role matching should use the role catalogue in `src/data/roles.ts`: match postings on the catalogue titles and their aliases (e.g. a "SWE" posting matches a user who chose "Software engineer"), and fall back to plain text for roles users typed that aren't in the catalogue.
- [x] **6.2a Data pipeline.** `job_boards` and `job_postings` tables with RLS; fetchers for Greenhouse, Lever and Ashby; normaliser; daily GitHub Actions workflow (`.github/workflows/jobs-feed.yml`, `scripts/jobs/`); starter list loader (`scripts/jobs/seed-boards.csv`); flywheel registration from paste-link and import. Also the plan's section 7: LinkedIn links are no longer fetched.
- [x] **6.2b Enrichment.** Rules plus a Claude Haiku pass for new postings (role category and catalogue title, seniority, visa, region and time zone limits, remote eligibility), with a per-run cost cap and a dry-run mode. `scripts/jobs/rules.ts`, `scripts/jobs/enrich.ts`; Claude Haiku 5.5, about $0.0002 a posting; default cap $1 a run.
- [x] **6.2c Matching.** Profile fields (needs visa sponsorship, countries I can work in), scoring, `job_matches`, reasons. `scripts/jobs/matching.ts` (rules and scores), `scripts/jobs/match.ts` (daily step): up to 15 matches a person a day from postings first seen in the last 14 days; internships only for people looking for one.
- [x] **6.2d Jobs UI.** Jobs screen (today's matches, filters, empty states), posting page, save to board, "Not for me", closed state, bell notification. Also "I applied" (as in the prototype), optional "Not for me" reasons with Undo, earlier unseen matches, and the new-match count in the sidebar.

## Phase 7: Settings and launch
- [x] **7.1 Settings.** Name and email change, password change, Google connect/disconnect, appearance (light default, dark, match device), sessions and sign out other devices, export data (CSV), delete account. Includes the dark-mode toggle in Sidebar (deferred from 0.4, done). Notification choices are saved; email delivery comes with 7.2. Other devices can't be listed from the browser, so only this device and the sign-out buttons show.
- [x] **7.2 Email notifications.** Via Resend: weekly check-in, interview reminders, quiet hours, per-type toggles. Hourly GitHub Actions job (`.github/workflows/email-notifications.yml`, `scripts/email/`): one email per person per run, deduplicated by `email_log`; also follow-ups, deadlines and reminders, a job-match digest on Mondays and Thursdays, streak milestones and a monthly recap; one-click unsubscribe (`api/unsubscribe.ts`).
- [ ] **7.3 Launch checks.** Landing page matches the product, privacy policy and terms, error tracking, basic analytics.

Out of scope for now: email/inbox sync.
