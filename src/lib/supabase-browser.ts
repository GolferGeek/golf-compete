import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Initialize Supabase client for browser-only use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Initializing browser Supabase client with URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase browser client credentials');
  throw new Error('Missing Supabase browser client credentials')
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be called on the client side');
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return browserClient;
};

// Reset the client (useful for testing or when signing out)
export const resetSupabaseBrowserClient = () => {
  browserClient = null;
};

// Helper function to check if a user is an admin
export const isUserAdmin = async () => {
  try {
    const client = getSupabaseBrowserClient();
    
    if (!client) {
      console.error('Failed to initialize Supabase client');
      return false;
    }
    
    // Get the current session
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Check if user is admin
    const { data: profileData } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
      
    return !!profileData?.is_admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
