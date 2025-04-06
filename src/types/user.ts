import { Database } from './supabase';
import { Profile } from './profile';

// Type for Supabase Auth User
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// Our application's User type that combines Auth and Profile
export interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: Profile;
}

// Re-export Profile type for convenience
export type { Profile };

// Export the raw database types
export type UserRow = Database['public']['Tables']['users']['Row'];

// Helper function to convert auth user to our User type
export function toUser(authUser: AuthUser, profile?: Profile): User {
  return {
    id: authUser.id,
    email: authUser.email,
    created_at: authUser.created_at,
    profile
  };
}

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  handicap: number | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  multiple_clubs_sets: boolean | null;
  openai_api_key: string | null;
  use_own_openai_key: boolean | null;
  ai_assistant_enabled: boolean | null;
} 