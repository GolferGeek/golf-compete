import * as db from '../database/databaseService';
import { supabase } from '@/lib/supabase';

// Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  role?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  avatar_url?: string;
  handicap?: number;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all users with optional pagination
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with the users
 */
export const fetchAllUsers = async (limit?: number, offset?: number): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 100) - 1);

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data as unknown as User[];
  } catch (error) {
    console.error('Error in fetchAllUsers:', error);
    throw error;
  }
};

/**
 * Fetches a user by ID
 * @param userId The ID of the user
 * @returns Promise with the user
 */
export const fetchUserById = async (userId: string): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    return data as unknown as User;
  } catch (error) {
    console.error('Error in fetchUserById:', error);
    throw error;
  }
};

/**
 * Updates a user's role
 * @param userId The ID of the user
 * @param role The new role
 * @returns Promise with the updated user
 */
export const updateUserRole = async (userId: string, role: string): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }

    return data as unknown as User;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    throw error;
  }
};

/**
 * Fetches a user's profile
 * @param userId The ID of the user
 * @returns Promise with the profile
 */
export const fetchUserProfile = async (userId: string): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data as unknown as Profile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    throw error;
  }
};

/**
 * Creates or updates a user profile
 * @param profile The profile data
 * @returns Promise with the updated profile
 */
export const upsertUserProfile = async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }

    return data as unknown as Profile;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    throw error;
  }
};

/**
 * Fetches a user with their profile
 * @param userId The ID of the user
 * @returns Promise with the user and profile
 */
export const fetchUserWithProfile = async (userId: string): Promise<{ user: User; profile: Profile }> => {
  try {
    const user = await fetchUserById(userId);
    const profile = await fetchUserProfile(userId);

    return { user, profile };
  } catch (error) {
    console.error('Error in fetchUserWithProfile:', error);
    throw error;
  }
};

/**
 * Searches for users by name or email
 * @param searchTerm The search term
 * @param limit Optional limit for pagination
 * @returns Promise with the matching users and their profiles
 */
export const searchUsers = async (searchTerm: string, limit?: number): Promise<{ user: User; profile: Profile }[]> => {
  try {
    // First search in profiles for name matches
    const { data: profileMatches, error: profileError } = await supabase
      .from('profiles')
      .select('*, users(*)')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .limit(limit || 20);

    if (profileError) {
      console.error('Error searching profiles:', profileError);
      throw profileError;
    }

    // Then search in users for email matches
    const { data: userMatches, error: userError } = await supabase
      .from('users')
      .select('*, profiles(*)')
      .ilike('email', `%${searchTerm}%`)
      .limit(limit || 20);

    if (userError) {
      console.error('Error searching users:', userError);
      throw userError;
    }

    // Combine and deduplicate results
    const results: { user: User; profile: Profile }[] = [];
    const userIds = new Set<string>();

    // Process profile matches
    profileMatches?.forEach((match: any) => {
      if (match.users && !userIds.has(match.users.id)) {
        userIds.add(match.users.id);
        results.push({
          user: match.users as User,
          profile: {
            id: match.id,
            user_id: match.user_id,
            first_name: match.first_name,
            last_name: match.last_name,
            display_name: match.display_name,
            avatar_url: match.avatar_url,
            handicap: match.handicap,
            phone_number: match.phone_number,
            address: match.address,
            city: match.city,
            state: match.state,
            zip_code: match.zip_code,
            created_at: match.created_at,
            updated_at: match.updated_at
          }
        });
      }
    });

    // Process user matches
    userMatches?.forEach((match: any) => {
      if (match.profiles && !userIds.has(match.id)) {
        userIds.add(match.id);
        results.push({
          user: {
            id: match.id,
            email: match.email,
            created_at: match.created_at,
            updated_at: match.updated_at,
            last_sign_in_at: match.last_sign_in_at,
            role: match.role
          },
          profile: match.profiles as Profile
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    throw error;
  }
};

/**
 * Disables a user account
 * @param userId The ID of the user
 * @returns Promise with the result
 */
export const disableUser = async (userId: string): Promise<boolean> => {
  try {
    // This would typically call an admin function or API
    // For Supabase, you might need to use a server-side function or API
    // This is a placeholder implementation
    const { error } = await supabase.rpc('disable_user', { user_id: userId });

    if (error) {
      console.error('Error disabling user:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in disableUser:', error);
    throw error;
  }
};

/**
 * Enables a user account
 * @param userId The ID of the user
 * @returns Promise with the result
 */
export const enableUser = async (userId: string): Promise<boolean> => {
  try {
    // This would typically call an admin function or API
    // For Supabase, you might need to use a server-side function or API
    // This is a placeholder implementation
    const { error } = await supabase.rpc('enable_user', { user_id: userId });

    if (error) {
      console.error('Error enabling user:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in enableUser:', error);
    throw error;
  }
}; 