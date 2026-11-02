// Mirrors supabase/migrations. When the schema changes, update this file
// (or regenerate with: npx supabase gen types typescript --linked > src/lib/database.types.ts).

export const STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const
export type ApplicationStatus = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  job_url: string | null
  location: string | null
  work_mode: WorkMode | null
  status: ApplicationStatus
  salary: string | null
  source: string | null
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

export type NewApplication = Pick<Application, 'company' | 'role'> &
  Partial<Pick<Application, 'job_url' | 'location' | 'work_mode' | 'status' | 'salary' | 'source' | 'notes' | 'applied_at'>>
