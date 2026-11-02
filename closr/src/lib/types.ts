// Mirrors supabase/migrations. When the schema changes, update this file
// (or regenerate with: npx supabase gen types typescript --linked > src/lib/database.types.ts).

export const STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'closed'] as const
export type ApplicationStatus = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  closed: 'Closed',
}

// Every closed application has one of these (enforced by a DB check constraint).
export const CLOSE_REASONS = ['rejected', 'no_response', 'withdrew', 'declined_offer'] as const
export type CloseReason = (typeof CLOSE_REASONS)[number]

export const CLOSE_REASON_LABEL: Record<CloseReason, string> = {
  rejected: 'Rejected',
  no_response: 'No response',
  withdrew: 'Withdrew',
  declined_offer: 'Declined offer',
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export const WORK_MODE_LABEL: Record<WorkMode, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' }

export const VISA_OPTIONS = ['yes', 'no', 'unknown', 'not_needed'] as const
export type VisaSponsorship = (typeof VISA_OPTIONS)[number]

export const VISA_LABEL: Record<VisaSponsorship, string> = {
  yes: 'Sponsors visa',
  no: 'No sponsorship',
  unknown: 'Unknown',
  not_needed: 'Not needed',
}

// One list for both "source" (where the job was found) and "interview origin".
export const JOB_CHANNELS = ['social', 'job_board', 'career_page', 'referral', 'recruiter', 'community', 'other'] as const
export type JobChannel = (typeof JOB_CHANNELS)[number]

export const SOURCE_LABEL: Record<JobChannel, string> = {
  social: 'LinkedIn or X post',
  job_board: 'Job board',
  career_page: 'Company career page',
  referral: 'Referral',
  recruiter: 'Recruiter reached out',
  community: 'Community',
  other: 'Other',
}

// Wording and order from the prototype's "What got you this interview?" dialog.
export const INTERVIEW_ORIGINS = ['referral', 'career_page', 'recruiter', 'social', 'community', 'job_board'] as const
export const INTERVIEW_ORIGIN_LABEL: Record<JobChannel, string> = {
  referral: 'Referral',
  career_page: 'Applied on career page',
  recruiter: 'Recruiter reached out',
  social: 'LinkedIn or X post',
  community: 'Community (Slack, Discord)',
  job_board: 'Job board',
  other: 'Other',
}

// Currencies offered in the UI (the prototype's list); the DB accepts any ISO 4217 code.
export const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD'] as const
export const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', SGD: 'S$' }

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  job_url: string | null
  location: string | null
  work_mode: WorkMode | null
  status: ApplicationStatus
  close_reason: CloseReason | null
  time_zone: string | null
  visa_sponsorship: VisaSponsorship
  // Whole currency units per year.
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  source: JobChannel | null
  // What was typed as the source before it became a fixed list (kept, not shown).
  source_detail: string | null
  interview_origin: JobChannel | null
  next_action: string | null
  // Legacy free-text salary from before salary_min/max; not shown.
  salary: string | null
  // Set on jobs that came from a spreadsheet import; "Undo import" deletes by it.
  import_id: string | null
  // The CV version sent for this job (roadmap 4.1); null = not recorded.
  cv_version_id: string | null
  // Last "No reply yet" answer on a check-in (roadmap 4.2); asked again 7 days later.
  checked_in_at: string | null
  notes: string | null
  applied_at: string | null
  position: number
  created_at: string
  updated_at: string
}

export type ApplicationEventType = 'created' | 'status_change' | 'interview' | 'note'

export interface ApplicationEvent {
  id: string
  application_id: string
  user_id: string
  type: ApplicationEventType
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus | null
  close_reason: CloseReason | null
  note: string | null
  occurred_at: string
  created_at: string
}

export const INTERVIEW_FORMATS = ['video', 'phone', 'onsite'] as const
export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number]

export const FORMAT_LABEL: Record<InterviewFormat, string> = {
  video: 'Video',
  phone: 'Phone',
  onsite: 'Onsite',
}

export const INTERVIEW_OUTCOMES = ['pending', 'passed', 'failed', 'cancelled'] as const
export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number]

export const OUTCOME_LABEL: Record<InterviewOutcome, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: "Didn't pass",
  cancelled: 'Cancelled',
}

// Reminders (roadmap 3.1, prototype REM_TYPES). Interviews are reminders of type 'interview'.
export const REMINDER_TYPES = ['follow', 'interview', 'deadline', 'custom'] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export const REMINDER_LABEL: Record<ReminderType, string> = {
  follow: 'Follow up',
  interview: 'Interview',
  deadline: 'Deadline',
  custom: 'Reminder',
}

export interface Reminder {
  id: string
  user_id: string
  application_id: string | null
  type: ReminderType
  title: string
  due_at: string
  // When set, the reminder is due then instead of due_at.
  snoozed_until: string | null
  notes: string | null
  done: boolean
  done_at: string | null
  // Interview reminders only.
  interview_format: InterviewFormat | null
  interview_location: string | null
  interviewer: string | null
  interview_outcome: InterviewOutcome | null
  created_at: string
  updated_at: string
}

export type ReminderFields = Pick<Reminder, 'type' | 'title' | 'due_at'> &
  Partial<
    Pick<
      Reminder,
      | 'application_id'
      | 'snoozed_until'
      | 'notes'
      | 'done'
      | 'done_at'
      | 'interview_format'
      | 'interview_location'
      | 'interviewer'
      | 'interview_outcome'
    >
  >

// In-app notifications (roadmap 3.3, prototype NOTIF_KIND). Created by the app from reminders.
export type NotificationKind = 'interview' | 'overdue' | 'deadline' | 'checkin'

export interface AppNotification {
  id: string
  user_id: string
  kind: NotificationKind
  reminder_id: string | null
  application_id: string | null
  title: string
  body: string
  dedupe_key: string
  read_at: string | null
  cleared_at: string | null
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  company: string | null
  title: string | null
  email: string | null
  linkedin_url: string | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export type NewContact = Pick<Contact, 'name'> &
  Partial<Pick<Contact, 'company' | 'title' | 'email' | 'linkedin_url' | 'notes' | 'last_contacted_at'>>

export interface ApplicationContact {
  application_id: string
  contact_id: string
  user_id: string
  created_at: string
}

export type SearchStage = 'starting' | 'applying' | 'interviewing' | 'browsing'
export type WeeklyPace = 'ease' | 'steady' | 'push'
export type IdealStart = 'asap' | 'months' | 'right_fit'

// Applications a week per pace (prototype PACE_N); the target itself is used in Phase 5.
export const PACE_TARGET: Record<WeeklyPace, number> = { ease: 2, steady: 5, push: 10 }

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  search_stage: SearchStage | null
  target_roles: string[]
  weekly_pace: WeeklyPace
  work_setups: WorkMode[]
  locations: string | null
  salary_floor: number | null
  salary_floor_currency: string | null
  ideal_start: IdealStart | null
  // null until onboarding is finished or skipped.
  onboarded_at: string | null
  // Offer a follow-up 7 days out when a job is marked Applied.
  suggest_follow_ups: boolean
  created_at: string
  updated_at: string
}

export type NewApplication = Pick<Application, 'company' | 'role'> &
  Partial<
    Pick<
      Application,
      | 'job_url'
      | 'location'
      | 'work_mode'
      | 'status'
      | 'time_zone'
      | 'visa_sponsorship'
      | 'salary_min'
      | 'salary_max'
      | 'salary_currency'
      | 'source'
      | 'interview_origin'
      | 'next_action'
      | 'notes'
      | 'applied_at'
      | 'cv_version_id'
    >
  >

// CV/résumé versions (roadmap 4.1, prototype CVS). Archived ones are hidden from pickers.
export interface CvVersion {
  id: string
  user_id: string
  label: string
  format: string | null
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

// The prototype's format choices.
export const CV_FORMATS = ['UK/EU CV, no photo', 'US résumé, 1 page', 'Canada résumé', 'DACH CV, with photo'] as const
