'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/profileService'
import { type AuthProfile } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  error: Error | null
  supabase: SupabaseClient<Database> | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

// Create a default context value to avoid hydration mismatch
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  supabase: null,
  refreshProfile: async () => {},
  signOut: async () => {}
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null)
  const router = useRouter()

  const fetchAndSetProfile = async () => {
    try {
      const profileData = await getCurrentProfile();
      if (profileData) {
        // No need to adapt, since getCurrentProfile now returns AuthProfile directly
        setProfile(profileData);
      } else {
        setProfile(null);
        console.log('No profile data returned from getCurrentProfile');
      }
    } catch (err) {
      console.error("Error fetching profile in AuthContext:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      setProfile(null);
    }
  }

  useEffect(() => {
    // Initialize client once
    const client = getSupabaseBrowserClient()
    setSupabaseClient(client)

    // Initial session fetch
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        // Call fetchAndSetProfile without userId
        fetchAndSetProfile()
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    // Listener for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.id)
        setIsLoading(true)
        setSession(session)
        if (session?.user?.id) {
          // Call fetchAndSetProfile without userId
          await fetchAndSetProfile()
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (session?.user?.id && supabaseClient) {
      console.log('Refreshing profile data...')
      setIsLoading(true)
      // Call fetchAndSetProfile without userId
      await fetchAndSetProfile()
      setIsLoading(false)
    } else {
      console.warn('Attempted to refresh profile with no active session.')
    }
  }

  // Function to sign out
  const signOut = async () => {
    if (!supabaseClient) return
    try {
      // Use the state client
      const client = supabaseClient
      
      console.log('Signing out...')
      
      // Clear local state first
      setProfile(null)
      setSession(null)
      
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        console.log('Clearing local storage items...')
        localStorage.clear()
      }
      
      // Now call the Supabase signOut
      const { error } = await client.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        return
      }
      
      console.log('Successfully signed out')
      
      // Redirect to home page using replace to prevent back button issues
      router.replace('/')
    } catch (error) {
      console.error('Unexpected error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading: isLoading,
        error: error,
        supabase: supabaseClient,
        refreshProfile,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}