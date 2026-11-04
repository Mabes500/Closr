import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary, cleanUrl, startErrorTracking } from './lib/monitoring'

startErrorTracking()

// Shown instead of a blank page if a screen crashes. It sits outside the router and the app's
// data, so it works whatever went wrong.
function CrashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper-50 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Something went wrong</h1>
      <p className="max-w-sm text-[15px] leading-normal text-ink-500">Your data is safe. Reloading usually fixes this.</p>
      <a href="/" className="mt-2 rounded-xl bg-action px-5 py-2.5 text-sm font-semibold text-on-action hover:bg-action-hover">
        Reload Closr
      </a>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<CrashScreen />}>
      <App />
    </ErrorBoundary>
    <Analytics beforeSend={(event) => ({ ...event, url: cleanUrl(event.url) })} />
  </StrictMode>,
)
