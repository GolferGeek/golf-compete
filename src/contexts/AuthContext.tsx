'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, getUserProfile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Profile = {
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
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Set mounted flag to true when component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Safely fetch a user profile with error handling
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await getUserProfile(userId)
      
      if (error) {
        console.error('Error fetching profile:', error)
        
        // If we get an infinite recursion error, create a minimal profile object
        if (error.message && error.message.includes('infinite recursion')) {
          console.warn('Using fallback profile due to recursion error')
          // Return a minimal profile with just the ID
          return { id: userId } as Profile
        }
        return null
      }
      
      return data as Profile
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      return null
    }
  }

  useEffect(() => {
    // Only run auth initialization on the client side
    if (!isMounted) return

    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        console.log('Attempting auth initialization', new Date())
        
        // Clear any stale auth data from localStorage if there are issues
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('supabase.auth.token')
            if (authData) {
              const parsed = JSON.parse(authData)
              // Check if token is expired or malformed
              if (!parsed || !parsed.access_token || !parsed.refresh_token) {
                console.log('Found invalid auth data, clearing...')
                localStorage.removeItem('supabase.auth.token')
              }
            }
          } catch (e) {
            console.error('Error checking auth data:', e)
            // If there's an error parsing, clear the item
            localStorage.removeItem('supabase.auth.token')
          }
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          // Handle specific errors
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('Invalid refresh token, clearing auth data')
            await supabase.auth.signOut()
          }
          setSession(null)
          setUser(null)
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
            console.log('Auth state changed:', event, session ? 'Has session' : 'No session')
            setSession(session)
            setUser(session?.user || null)

            if (session?.user) {
              const profileData = await fetchUserProfile(session.user.id)
              setProfile(profileData)
            } else {
              setProfile(null)
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
  }, [isMounted]) // Only run when isMounted changes to true

  const refreshProfile = async () => {
    if (!user) {
      console.log('refreshProfile called but no user is logged in')
      return
    }
    
    console.log('refreshProfile called for user:', user.id)
    
    try {
      const profileData = await fetchUserProfile(user.id)
      if (profileData) {
        setProfile(profileData)
        console.log('Profile state updated')
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signOut: handleSignOut,
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