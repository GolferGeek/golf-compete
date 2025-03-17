export interface User {
  id: string;
  email: string;
  active: boolean;
  profile?: Profile;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  handicap?: number;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
  multiple_clubs_sets?: boolean;
  openai_api_key?: string;
  use_own_openai_key?: boolean;
  ai_assistant_enabled?: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  active: boolean;
  profile: ProfileRow | null;
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