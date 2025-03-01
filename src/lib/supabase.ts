import { createClient } from '@supabase/supabase-js'
import { Profile } from '@/types/database.types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key (first 8 chars):', supabaseAnonKey.substring(0, 8))

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (response.error) {
      console.error('Sign in error:', {
        message: response.error.message,
        status: response.error.status,
        name: response.error.name
      })
    }
    
    return response
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    throw error
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password
  })
}

export const signInWithGoogle = async () => {
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : `${window.location.origin}/auth/callback`

  return await supabase.auth.signInWithOAuth({
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
  return await supabase.auth.getSession()
}

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user
}

// Profile management
export const getUserProfile = async (userId: string) => {
  console.log('getUserProfile called for userId:', userId)
  
  try {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('getUserProfile result:', result)
    return result
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    throw error
  }
}

export const createUserProfile = async (profile: Profile) => {
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