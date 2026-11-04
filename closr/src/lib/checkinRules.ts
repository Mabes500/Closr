import type { Application } from './types.ts'

// Shared by the Check-ins screen and the weekly check-in email (scripts/email/send.ts).

export const CHECKIN_DAYS = 7

// When a job went quiet: the latest of applying, its last event, and the last "No reply yet".
export function quietSince(app: Pick<Application, 'applied_at' | 'created_at' | 'checked_in_at'>, lastEvent: string | undefined) {
  return [app.applied_at ? `${app.applied_at}T12:00:00` : app.created_at, lastEvent, app.checked_in_at]
    .filter((t): t is string => !!t)
    .map((t) => new Date(t).toISOString())
    .sort()
    .at(-1)!
}
