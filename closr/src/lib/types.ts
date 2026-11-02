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

export interface Interview {
  id: string
  application_id: string
  user_id: string
  round_name: string
  scheduled_at: string
  format: InterviewFormat | null
  interviewer: string | null
  notes: string | null
  outcome: InterviewOutcome
  created_at: string
  updated_at: string
}

export type NewInterview = Pick<Interview, 'application_id' | 'round_name' | 'scheduled_at'> &
  Partial<Pick<Interview, 'format' | 'interviewer' | 'notes' | 'outcome'>>

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
    >
  >
