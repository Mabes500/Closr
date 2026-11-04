import * as Sentry from '@sentry/react'

// Error tracking and visit counts send as little as possible. Sign-in and password-reset links
// carry tokens after the ? or #, so addresses are always cut down first, and job and posting ids
// become [id]. No names, emails, job details, clicks or session recordings are sent.
const ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

export function cleanUrl(raw: string) {
  const bare = raw.split(/[?#]/)[0]
  return bare.replace(ID, '[id]')
}

// Does nothing until VITE_SENTRY_DSN is set in Vercel.
export function startErrorTracking() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Sentry collects all of these unless told not to.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    integrations: (defaults) => defaults.filter((i) => i.name !== 'BrowserSession'),
    beforeBreadcrumb: () => null,
    beforeSend(event) {
      delete event.user
      if (event.request) event.request = event.request.url ? { url: cleanUrl(event.request.url) } : {}
      return event
    },
  })
}

// For failures the app handles itself, such as a page's data not loading. Only the message is
// sent, because a database error's other fields can quote the row. A dropped connection is the
// visitor's network, not a bug.
export function reportError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error)
  if (/failed to fetch|networkerror|load failed/i.test(message)) return
  Sentry.captureException(new Error(message))
}

export const ErrorBoundary = Sentry.ErrorBoundary
