'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { type AuthProfile } from '@/services/internal/AuthService'
import { getSession } from '@/lib/apiClient/auth'
import { fetchUserProfile } from '@/lib/apiClient/profile'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  error: Error | null
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
  refreshProfile: async () => {},
  signOut: async () => {}
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  
  // Fetch auth state on initial load
  useEffect(() => {
    async function loadInitialSession() {
      setIsLoading(true)
      
      try {
        // This will read from cookies automatically
        const sessionData = await getSession()
        
        // No session - clear everything
        if (!sessionData || !sessionData.session || !sessionData.user) {
          setSession(null)
          setUser(null)
          setProfile(null)
          return
        }
        
        // Set user and session
        setUser(sessionData.user)
        setSession(sessionData.session)
        
        // Get profile from session data or fetch separately
        if (sessionData.profile) {
          setProfile(sessionData.profile)
        } else if (sessionData.user) {
          try {
            const profileData = await fetchUserProfile()
            setProfile(profileData || null)
          } catch (profileErr) {
            console.error('Error fetching profile:', profileErr)
            setProfile(null)
          }
        }
      } catch (err) {
        console.error('Error fetching initial auth state:', err)
        setError(err instanceof Error ? err : new Error('Auth error'))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadInitialSession()
  }, [])
  
  // Only refresh profile data, not the entire auth state
  const refreshProfile = async () => {
    if (!user) {
      console.warn('Cannot refresh profile: No logged-in user')
      return
    }
    
    setIsLoading(true)
    
    try {
      const profileData = await fetchUserProfile()
      setProfile(profileData)
    } catch (err) {
      console.error('Error refreshing profile:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to sign out
  const signOut = async () => {
    setIsLoading(true)
    
    try {
      // Clear local state first
      setProfile(null)
      setSession(null)
      setUser(null)
      
      // Call the API logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      // Redirect to home page
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading: isLoading,
        error,
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