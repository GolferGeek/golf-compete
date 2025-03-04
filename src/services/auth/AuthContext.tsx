'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import * as authService from './authService'
import { Profile } from './authService'

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
      const userProfile = await authService.getUserProfile(userId)
      setProfile(userProfile)
      return userProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  // Function to sign out
  const handleSignOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Get current session
        const currentSession = await authService.getSession()
        setSession(currentSession)
        
        if (currentSession) {
          // Get current user
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          
          // Get user profile
          if (currentUser) {
            await fetchUserProfile(currentUser.id)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
    
    // Set up auth state change listener
    const { data: authListener } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        
        if (session) {
          // User is signed in
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          
          if (currentUser) {
            await fetchUserProfile(currentUser.id)
          }
        } else {
          // User is signed out
          setUser(null)
          setProfile(null)
        }
        
        setIsLoading(false)
      }
    )
    
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router])

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
  return useContext(AuthContext)
} 