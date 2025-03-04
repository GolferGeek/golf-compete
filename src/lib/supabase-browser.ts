import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client for browser-only use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a client specifically for browser-side use with persistent sessions
export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or API key');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false, // Disable debug mode for auth to prevent verbose console logs
      },
    });
  } catch (error) {
    console.error('Error creating Supabase browser client:', error);
    return null;
  }
};

// Create a singleton instance for use throughout the app
let browserClient: SupabaseClient | null = null;

// Get the browser client (creates it if it doesn't exist)
export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    console.warn('getBrowserClient should only be called on the client side');
    return null;
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  
  return browserClient;
};

// Helper function to check if a user is an admin
export const isUserAdmin = async () => {
  try {
    const client = getBrowserClient();
    
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
