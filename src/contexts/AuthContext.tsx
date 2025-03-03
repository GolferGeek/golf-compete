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
  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await getUserProfile(userId)
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      if (!data || typeof data.id !== 'string') return null

      // Ensure the data matches the Profile type
      const profileData: Profile = {
        id: data.id,
        first_name: typeof data.first_name === 'string' ? data.first_name : undefined,
        last_name: typeof data.last_name === 'string' ? data.last_name : undefined,
        username: typeof data.username === 'string' ? data.username : undefined,
        handicap: typeof data.handicap === 'number' ? data.handicap : undefined,
        multiple_clubs_sets: typeof data.multiple_clubs_sets === 'boolean' ? data.multiple_clubs_sets : undefined,
        is_admin: typeof data.is_admin === 'boolean' ? data.is_admin : undefined,
        created_at: typeof data.created_at === 'string' ? data.created_at : undefined,
        updated_at: typeof data.updated_at === 'string' ? data.updated_at : undefined
      }
      
      return profileData
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
      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  // Function to sign out
  const signOut = async () => {
    try {
      const supabase = getBrowserClient()
      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }

      console.log('Signing out user...')
      
      // Clear local state first
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        console.log('Clearing local storage items...')
        localStorage.clear() // Clear all local storage items
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
        if (!supabase) {
          console.error('Supabase client not initialized')
          setIsLoading(false)
          return
        }
        
        console.log('Initializing auth state...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }
        
        console.log('Session retrieved:', session ? 'Valid session' : 'No session')
        
        if (session) {
          // Try to refresh the session
          console.log('Attempting to refresh session...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('Error refreshing session:', refreshError)
            // Clear any stale session data
            setSession(null)
            setUser(null)
            setProfile(null)
            setIsLoading(false)
            return
          }
          
          if (refreshData.session) {
            console.log('Session refreshed successfully')
            setSession(refreshData.session)
            setUser(refreshData.session.user)
            
            const profileData = await fetchUserProfile(refreshData.session.user.id)
            if (profileData) {
              setProfile(profileData)
            }
          }
        } else {
          // No session found
          setSession(null)
          setUser(null)
          setProfile(null)
        }

        // Set up auth state listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session ? 'Has session' : 'No session')
            
            if (event === 'SIGNED_OUT') {
              // Clear all state
              setSession(null)
              setUser(null)
              setProfile(null)
              return
            }
            
            if (session) {
              setSession(session)
              setUser(session.user)
              
              const profileData = await fetchUserProfile(session.user.id)
              if (profileData) {
                setProfile(profileData)
              }
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
      }
    }

    initializeAuth()
  }, [router])

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