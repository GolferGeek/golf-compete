'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/supabase'
import { getBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export type Profile = {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  handicap?: number
  multiple_clubs_sets?: boolean
  is_admin?: boolean
  created_at?: string
  updated_at?: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// Create a default context value to avoid hydration mismatch
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await getUserProfile(userId)
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!user) {
      console.log('Cannot refresh profile: No user')
      return
    }
    
    try {
      const profileData = await fetchUserProfile(user.id)
      setProfile(profileData)
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  // Function to sign out
  const signOut = async () => {
    try {
      const supabase = getBrowserClient()
      console.log('Signing out user...')
      
      // Clear local state first
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        console.log('Clearing local storage items...')
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-refresh-token')
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-auth-token')
        
        // Clear any session storage items as well
        sessionStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('sb-refresh-token')
        sessionStorage.removeItem('sb-access-token')
        sessionStorage.removeItem('sb-auth-token')
      }
      
      // Now call the Supabase signOut
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        return
      }
      
      console.log('Successfully signed out')
      
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Unexpected error signing out:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const supabase = getBrowserClient()
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }
        
        console.log('Session retrieved:', session ? 'Valid session' : 'No session')
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          const profileData = await fetchUserProfile(session.user.id)
          setProfile(profileData)
        }

        // Set up auth state listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
            console.log('[Supabase session state]', session);
            
            // Always update state to match the actual session state
            setSession(session);
            setUser(session?.user || null);
            
            if (session?.user) {
              const profileData = await fetchUserProfile(session.user.id);
              setProfile(profileData);
            } else {
              // Clear profile when session is gone
              setProfile(null);
            }
          }
        );

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signOut,
        refreshProfile
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