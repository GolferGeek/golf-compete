import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

if (supabaseUrl && supabaseServiceKey) {
  // Use service role key for server-side operations (bypasses RLS)
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: typeof window !== 'undefined', // Only persist on client-side
      autoRefreshToken: typeof window !== 'undefined', // Only auto-refresh on client-side
      detectSessionInUrl: typeof window !== 'undefined', // Only detect in URL on client-side
      storage: customStorage,
    },
  });
} else if (supabaseUrl && supabaseAnonKey) {
  // Fallback to anon key if service role key is not available
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined', // Only persist on client-side
      autoRefreshToken: typeof window !== 'undefined', // Only auto-refresh on client-side
      detectSessionInUrl: typeof window !== 'undefined', // Only detect in URL on client-side
      storage: customStorage,
    },
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
export const signInWithEmail = async (email: string, password: string, client: ReturnType<typeof createClient>) => {
  try {
    console.log('Signing in with email using provided client')
    return await client.auth.signInWithPassword({
      email,
      password
    })
  } catch (error) {
    console.error('Error signing in with email:', error)
    throw error
  }
}

export const signUpWithEmail = async (
  client: ReturnType<typeof createClient>,
  email: string,
  password: string
) => {
  try {
    const result = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    console.log('Sign up result:', result)
    return result
  } catch (error) {
    console.error('Error signing up with email:', error)
    throw error
  }
}

export const signInWithGoogle = async (client: ReturnType<typeof createClient>) => {
  // Get the current origin for the redirect URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Use environment variable if available, otherwise use origin
  // Make sure to use the full URL including the protocol
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : `${origin}/auth/callback`;

  console.log('Google sign in redirect URL:', redirectTo);
  
  try {
    // Now initiate the OAuth flow with explicit scopes
    console.log('Initiating Google OAuth flow');
    
    // Clear any existing session first to prevent conflicts
    await client.auth.signOut();
    
    // Add a small delay to ensure signOut completes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear any existing auth-related cookies and local storage
    if (typeof window !== 'undefined') {
      console.log('Clearing any existing auth data before sign-in');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-auth-token');
      
      // Also clear any code verifier that might be stored
      localStorage.removeItem('supabase.auth.code_verifier');
    }
    
    // Use PKCE flow for more secure authentication (configured in the client)
    const result = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        skipBrowserRedirect: false
      }
    });
    
    console.log('Google sign in result:', result);
    
    if (result.error) {
      console.error('Error in OAuth initiation:', result.error);
      throw result.error;
    }
    
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
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
export const getUserProfile = async (userId?: string) => {
  try {
    // If no userId is provided, get the current user's ID
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('No active session found when getting user profile');
        return { data: null, error: { message: 'No active session', code: 'AUTH_REQUIRED' } };
      }
      
      userId = sessionData.session.user.id;
    }
    
    console.log('Getting user profile for:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    return { data: null, error };
  }
};

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

// Function to refresh the schema cache
export const refreshSchemaCache = async () => {
  try {
    console.log('Attempting to refresh Supabase schema cache...');
    
    // Make a request to the Supabase REST API to refresh the schema cache
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    // Also make a specific request to the courses table to ensure its schema is cached
    const coursesResponse = await fetch(`${supabaseUrl}/rest/v1/courses?select=id,name&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    // Make a direct query to the database using Supabase client as well
    const { data, error } = await supabase
      .from('courses')
      .select('id, name')
      .limit(1);
      
    if (error) {
      console.error('Error querying courses table:', error);
    } else {
      console.log('Successfully queried courses table, schema should be cached');
    }
    
    if (response.ok && coursesResponse.ok) {
      console.log('Schema cache refresh requests successful');
      return true;
    } else {
      console.error('Failed to refresh schema cache:', 
        response.ok ? '' : response.statusText, 
        coursesResponse.ok ? '' : coursesResponse.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error refreshing schema cache:', error);
    return false;
  }
}; 