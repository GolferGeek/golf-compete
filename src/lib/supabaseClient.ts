import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create the appropriate client based on available credentials
export function createSupabaseClient(options: { useServiceRole?: boolean } = {}) {
  const { useServiceRole = false } = options
  
  // Use service role key for server-side operations if available and requested
  const key = useServiceRole && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey
  
  if (!supabaseUrl || !key) {
    throw new Error('Missing required Supabase configuration')
  }

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      storage: customStorage,
    },
  })
}

// Create default client instance
export const supabase = createSupabaseClient() 