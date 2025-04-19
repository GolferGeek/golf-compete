'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { type AuthProfile } from '@/api/internal/database/AuthService'
import { getSession } from '@/lib/apiClient/auth'
import { fetchUserProfile } from '@/lib/apiClient/profile'
import { type User, type Session } from '@/types/auth'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  error: Error | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profileData: Partial<AuthProfile>, userId?: string) => Promise<void>
}

// Create a default context value to avoid hydration mismatch
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  signOut: async () => {},
  updateProfile: async () => { throw new Error('Not implemented') }
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

  // Function to update any user's profile (self or other user if admin)
  const updateProfile = async (profileData: Partial<AuthProfile>, userId?: string) => {
    if (!user) {
      throw new Error('No user found. Please sign in.');
    }

    // If userId is provided and user is not admin, throw error
    if (userId && !profile?.is_admin) {
      throw new Error('Unauthorized: Only admins can update other users profiles');
    }

    setIsLoading(true);

    try {
      // Determine the endpoint based on whether we're updating another user or self
      const endpoint = userId ? `/api/users/${userId}/profile` : '/api/user/profile';

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      // Only refresh own profile if updating self
      if (!userId) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading: isLoading,
        error,
        refreshProfile,
        signOut,
        updateProfile
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