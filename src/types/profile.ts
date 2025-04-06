import { Database } from './supabase';

// Raw database type
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Cleaned up version with non-null fields where appropriate
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  handicap: number | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  multiple_clubs_sets: boolean | null;
}

export function cleanProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
    handicap: row.handicap,
    is_admin: row.is_admin,
    created_at: row.created_at,
    updated_at: row.updated_at,
    multiple_clubs_sets: row.multiple_clubs_sets
  };
} 