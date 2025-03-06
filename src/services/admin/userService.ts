import * as db from '../database/databaseService';
import { User, Profile, UserRow, ProfileRow } from '@/types/user';

// Types
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// Re-export types from @/types/user
export type { User, Profile, UserRow, ProfileRow };

interface ProfileResponse {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  handicap: number | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a ProfileRow from the database to a Profile
 */
const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  first_name: row.first_name || '',
  last_name: row.last_name || '',
  username: row.username || '',
  handicap: row.handicap || undefined,
  is_admin: row.is_admin,
  created_at: row.created_at,
  updated_at: row.updated_at
});

/**
 * Fetches all users with optional pagination
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with the users
 */
export const fetchAllUsers = async (limit?: number, offset?: number): Promise<User[]> => {
  try {
    const page = offset ? Math.floor(offset / (limit || 100)) + 1 : 1;
    const response = await fetch(`/api/users?page=${page}&per_page=${limit || 100}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    const data = await response.json();
    return data.users;
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
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user');
    }

    const data = await response.json();
    return data.user;
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
    const response = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user role');
    }

    // Fetch the complete user data
    return await fetchUserById(userId);
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    throw error;
  }
};

/**
 * Creates or updates a user profile
 * @param profile The profile data to update
 * @returns Promise with the updated profile
 */
export const upsertUserProfile = async (profile: Partial<Omit<Profile, 'created_at' | 'updated_at'>> & { id: string }): Promise<Profile> => {
  try {
    console.log('Starting upsertUserProfile with data:', profile);

    const response = await fetch(`/api/users/${profile.id}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const data = await response.json();
    console.log('Successfully updated profile:', data.profile);
    return toProfile(data.profile);
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    throw error;
  }
};

/**
 * Searches for users by name or email
 * @param searchTerm The search term
 * @param limit Optional limit for pagination
 * @returns Promise with the matching users
 */
export const searchUsers = async (searchTerm: string, limit?: number): Promise<User[]> => {
  try {
    const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}&per_page=${limit || 20}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search users');
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    throw error;
  }
};

/**
 * Disables a user account
 * @param userId The ID of the user
 * @returns Promise with the updated user
 */
export const disableUser = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}/disable`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to disable user');
    }

    return await fetchUserById(userId);
  } catch (error) {
    console.error('Error in disableUser:', error);
    throw error;
  }
};

/**
 * Enables a user account
 * @param userId The ID of the user
 * @returns Promise with the updated user
 */
export const enableUser = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}/enable`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to enable user');
    }

    return await fetchUserById(userId);
  } catch (error) {
    console.error('Error in enableUser:', error);
    throw error;
  }
};

/**
 * Creates a new user with auth and profile
 * @param email User's email
 * @param password User's password
 * @param profile Initial profile data
 * @returns Promise with the created user
 */
export const createUser = async (
  email: string,
  password: string,
  profile: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<User> => {
  try {
    // Create auth user
    const authResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new Error(error.message || 'Failed to create auth user');
    }

    const authData = await authResponse.json();
    if (!authData.user) {
      throw new Error('No user data returned from auth creation');
    }

    const timestamp = new Date().toISOString();
    
    // Create profile
    const profileResponse = await fetch(`/api/users/${authData.user.id}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...profile,
        created_at: timestamp,
        updated_at: timestamp
      }),
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.json();
      // Clean up auth user if profile creation fails
      await fetch(`/api/auth/delete/${authData.user.id}`, {
        method: 'DELETE',
      });
      throw new Error(error.message || 'Failed to create user profile');
    }

    const profileData = await profileResponse.json();
    if (!profileData.profile) {
      throw new Error('No profile data returned from profile creation');
    }

    // Return the complete user object
    return {
      id: authData.user.id,
      email: authData.user.email || '',
      active: true,
      profile: {
        id: profileData.profile.id,
        username: profileData.profile.username || '',
        first_name: profileData.profile.first_name || '',
        last_name: profileData.profile.last_name || '',
        handicap: profileData.profile.handicap || undefined,
        is_admin: profileData.profile.is_admin,
        created_at: profileData.profile.created_at,
        updated_at: profileData.profile.updated_at
      }
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}; 