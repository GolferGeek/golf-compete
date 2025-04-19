import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  handicap?: number;
  multiple_clubs_sets?: boolean;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AuthUser = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
};

/**
 * Get the current session
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Get the user profile
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Update password
 */
export const updatePassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, profile: Partial<Profile>) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return !!profile?.is_admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Set up auth state change listener
 */
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}; 