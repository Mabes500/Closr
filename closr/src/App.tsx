import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { ForgotPassword, ResetSent } from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Board from './pages/Board'
import Schedule from './pages/Schedule'
import CvVersions from './pages/CvVersions'
import ComingSoon from './pages/ComingSoon'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Import from './pages/Import'
import { useProfile } from './lib/profile'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, authError } = useAuth()
  const { pathname } = useLocation()
  // Render nothing until the session is known, so signed-in users never glimpse the landing page.
  if (loading) return null
  // Signed-out visitors see the landing page at /, and are sent to sign in from any other app page.
  // A failed sign-in redirect also goes to /login, where the error is shown.
  if (!session) return pathname === '/' && !authError ? <Landing /> : <Navigate to="/login" replace />
  return children
}

// Signed-in users who haven't finished (or skipped) onboarding are sent to it first.
// Works the same for email and Google sign-ups: both land on / after signing in.
function RequireOnboarded({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useProfile()
  if (isLoading) return null
  // No profile row would make onboarding unable to save, so let the user in rather than loop.
  if (profile && !profile.onboarded_at) return <Navigate to="/welcome" replace />
  return children
}

function SetupNeeded() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-sm">
      <h1 className="text-lg font-semibold">Supabase is not configured</h1>
      <p className="mt-2 text-ink-muted">
        Set <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in
        <code className="font-mono"> .env.local</code> (local) or in Vercel → Project → Settings → Environment Variables, then
        redeploy.
      </p>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/forgot/sent" element={<ResetSent />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route
              path="/welcome"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <RequireOnboarded>
                    <AppShell />
                  </RequireOnboarded>
                </RequireAuth>
              }
            >
              <Route index element={<Board />} />
              <Route path="jobs" element={<ComingSoon screen="jobs" />} />
              <Route path="goals" element={<ComingSoon screen="goals" />} />
              <Route path="checkins" element={<ComingSoon screen="checkins" />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="cv" element={<CvVersions />} />
              <Route path="import" element={<Import />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<ComingSoon screen="settings" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
