import { createClient } from '@supabase/supabase-js'
import { Profile } from '@/types/database.types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a custom storage object that safely handles server-side rendering
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return null
    }
    
    try {
      const itemStr = window.localStorage.getItem(key)
      if (!itemStr) {
        return null
      }
      return JSON.parse(itemStr)
    } catch (error) {
      console.error('Error reading from localStorage', error)
      return null
    }
  },
  setItem: (key: string, value: unknown) => {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const valueStr = JSON.stringify(value)
      window.localStorage.setItem(key, valueStr)
    } catch (error) {
      console.error('Error writing to localStorage', error)
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage', error)
    }
  }
}

// Check if we have the required environment variables before creating the client
let supabase: ReturnType<typeof createClient>;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: customStorage
    }
  });
} else {
  // Create a mock client with methods that return appropriate errors
  // This prevents crashes during build/test when env vars aren't available
  const mockErrorMessage = 'Supabase client not initialized: Missing environment variables';
  
  const createMockResponse = () => ({
    data: null,
    error: new Error(mockErrorMessage)
  });
  
  supabase = {
    auth: {
      getSession: async () => createMockResponse(),
      getUser: async () => createMockResponse(),
      signInWithPassword: async () => createMockResponse(),
      signUp: async () => createMockResponse(),
      signInWithOAuth: async () => createMockResponse(),
      signOut: async () => createMockResponse(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: async () => createMockResponse(),
      updateUser: async () => createMockResponse()
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => createMockResponse()
        }),
        single: async () => createMockResponse()
      }),
      insert: async () => createMockResponse(),
      update: () => ({
        eq: async () => createMockResponse()
      })
    })
  } as unknown as ReturnType<typeof createClient>;
  
  // Log warning only on the client side to avoid console spam during builds
  if (typeof window !== 'undefined') {
    console.warn(mockErrorMessage);
  }
}

export { supabase };

// Authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    console.log('Sign in result:', result)
    return result
  } catch (error) {
    console.error('Error signing in with email:', error)
    throw error
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await supabase.auth.signUp({
      email,
      password
    })
    
    console.log('Sign up result:', result)
    return result
  } catch (error) {
    console.error('Error signing up with email:', error)
    throw error
  }
}

export const signInWithGoogle = async () => {
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : `${window.location.origin}/auth/callback`

  console.log('Google sign in redirect URL:', redirectTo)
  
  try {
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    console.log('Google sign in result:', result)
    return result
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
}

export const updatePassword = async (newPassword: string) => {
  return await supabase.auth.updateUser({
    password: newPassword
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// Session management
export const getSession = async () => {
  try {
    const result = await supabase.auth.getSession()
    console.log('Get session result:', result)
    return result
  } catch (error) {
    console.error('Error getting session:', error)
    throw error
  }
}

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
    }
    return data?.user
  } catch (error) {
    console.error('Unexpected error getting current user:', error)
    return null
  }
}

// Profile management
export const getUserProfile = async (userId: string) => {
  console.log('getUserProfile called for userId:', userId)
  
  try {
    // Try to get the profile with a simple query
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // Log the result for debugging
    if (result.error) {
      console.error('Error in getUserProfile:', result.error)
    } else {
      console.log('getUserProfile result:', result.data ? 'Profile found' : 'No profile found')
    }
    
    return result
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error)
    throw error
  }
}

export const createUserProfile = async (profile: Record<string, unknown>) => {
  return await supabase
    .from('profiles')
    .insert(profile)
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  console.log('updateUserProfile called with userId:', userId)
  console.log('Updates to apply:', updates)
  
  try {
    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    
    console.log('Supabase update result:', result)
    return result
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    throw error
  }
} 