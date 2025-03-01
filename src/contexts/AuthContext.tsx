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

  useEffect(() => {
    // Only run auth initialization on the client side
    if (!isMounted) return

    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        console.log('Attempting initialization', new Date())
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          const { data: profile } = await getUserProfile(session.user.id)
          setProfile(profile)
        }

        // Set up auth state listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session)
            setUser(session?.user || null)

            if (session?.user) {
              const { data: profile } = await getUserProfile(session.user.id)
              setProfile(profile)
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
      console.log('Fetching updated profile data from Supabase')
      const { data, error } = await getUserProfile(user.id)
      
      if (error) {
        console.error('Error fetching profile in refreshProfile:', error)
        return
      }
      
      console.log('Profile data received:', data)
      setProfile(data)
      console.log('Profile state updated')
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