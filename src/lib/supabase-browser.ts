import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for browser-only use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a client specifically for browser-side use with persistent sessions
export const createBrowserClient = () => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  
  return client;
};

// Create a singleton instance for use throughout the app
let browserClient: ReturnType<typeof createClient> | null = null;

// Get the browser client (creates it if it doesn't exist)
export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient should only be called on the client side');
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
