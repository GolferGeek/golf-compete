'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { getCurrentProfile, type Profile } from '@/lib/profileService'

type AuthContextType = {
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// Create a default context value to avoid hydration mismatch
const defaultContextValue: AuthContextType = {
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const router = useRouter()

  // Function to fetch current profile
  const fetchCurrentProfile = async () => {
    try {
      const profileData = await getCurrentProfile()
      setProfile(profileData)
      return profileData
    } catch (error) {
      console.error('Error fetching current profile:', error)
      return null
    }
  }

  // Function to refresh profile
  const refreshProfile = async () => {
    if (!session?.user) {
      console.log('Cannot refresh profile: No session')
      return
    }
    
    try {
      await fetchCurrentProfile()
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  // Function to sign out
  const signOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      
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
      const { error } = await supabase.auth.signOut()
      
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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      if (hasInitialized) return

      try {
        setIsLoading(true)
        
        const supabase = getSupabaseBrowserClient()
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          setHasInitialized(true)
          return
        }
        
        console.log('Session retrieved:', session ? 'Valid session' : 'No session')
        
        if (session) {
          // Try to refresh the session
          console.log('Attempting to refresh session...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('Error refreshing session:', refreshError)
            setSession(null)
            setProfile(null)
            setIsLoading(false)
            setHasInitialized(true)
            return
          }
          
          if (refreshData.session) {
            console.log('Session refreshed successfully')
            setSession(refreshData.session)
            await fetchCurrentProfile()
          }
        } else {
          setSession(null)
          setProfile(null)
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event)
            
            if (event === 'SIGNED_OUT') {
              setSession(null)
              setProfile(null)
              return
            }
            
            if (session) {
              setSession(session)
              await fetchCurrentProfile()
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
        setHasInitialized(true)
      }
    }

    initializeAuth()
  }, [hasInitialized, router])

  return (
    <AuthContext.Provider
      value={{
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