import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Board from './pages/Board'
import Interviews from './pages/Interviews'
import Contacts from './pages/Contacts'

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
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Board />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="contacts" element={<Contacts />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
