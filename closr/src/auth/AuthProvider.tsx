import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  // Why the last sign-in redirect failed (e.g. an expired or already-used email link).
  authError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // initialize() finishes reading any sign-in tokens from the redirect URL
    // and reports if that failed; getSession() then returns the result.
    supabase.auth.initialize().then(async ({ error }) => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      if (error && !data.session) {
        setAuthError(error.message)
        // Drop the error details Supabase left in the URL so a reload starts clean.
        window.history.replaceState(window.history.state, '', window.location.pathname)
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ session, loading, authError, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
