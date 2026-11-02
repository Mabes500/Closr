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

export type NewApplication = Pick<Application, 'company' | 'role'> &
  Partial<Pick<Application, 'job_url' | 'location' | 'work_mode' | 'status' | 'salary' | 'source' | 'notes' | 'applied_at'>>
