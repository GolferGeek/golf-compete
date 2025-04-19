// src/types/database.ts

// Shared interfaces based on database schema
// TODO: Consider generating these types from Supabase schema for accuracy

export interface Series {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SeriesParticipant {
  id: string;
  user_id: string;
  series_id: string;
  role: 'admin' | 'participant';
  status: 'invited' | 'confirmed' | 'withdrawn';
  joined_at: string;
}

export interface Event {
  id: string;
  series_id?: string; 
  name: string;
  description?: string;
  event_date: string; 
  status: string; 
  course_id?: string;
  created_by: string; 
  created_at: string; 
  updated_at: string; 
}

export interface EventParticipant {
  id: string;
  user_id: string;
  event_id: string;
  status: string; 
  registration_date: string; 
  tee_time?: string;
  starting_hole?: number;
  group_number?: number;
  handicap_index?: number;
}

export interface Course {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  amenities?: string;
  created_by?: string; // Profile ID of the user who created the course
  created_at: string; 
  updated_at: string;
  is_active?: boolean;
  holes?: number;
  par?: number;
}

export interface CourseTee {
    id: string;
    course_id: string;
    tee_name: string;
    gender: 'Male' | 'Female' | 'Unisex';
    par: number;
    rating: number;
    slope_rating: number;
    yardage?: number;
}

export interface Hole {
    id: string;
    course_id: string;
    hole_number: number;
    par: number;
    handicap_index: number;
    yards?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Round {
    id: string;
    event_id: string;
    user_id: string;
    course_tee_id: string;
    round_date: string; 
    status: string; 
    handicap_index_used?: number;
    course_handicap?: number;
    net_score?: number;
    gross_score?: number;
    created_at: string;
    updated_at: string;
}

export interface Score {
    id: string;
    round_id: string;
    hole_number: number; 
    strokes: number;
    putts?: number;
    fairway_hit?: boolean;
    green_in_regulation?: boolean;
}

// User Notes (generic)
export interface UserNote {
    id: string;
    user_id: string;
    content: string;
    // Optional fields to link note to other resources
    related_resource_id?: string;
    related_resource_type?: 'series' | 'event' | 'round' | 'course' | 'player'; // Example types
    created_at: string;
    updated_at: string;
}

// Profile information linked to Supabase Auth user
export interface AuthProfile {
  id: string; // Corresponds to Supabase user ID
  first_name?: string;
  last_name?: string;
  username?: string;
  handicap?: number;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  // Add AI fields from profile page state
  multiple_clubs_sets?: boolean; // From form state
  openai_api_key?: string; 
  use_own_openai_key?: boolean;
  ai_assistant_enabled?: boolean;
  // Add any other fields from your 'profiles' table
}

// Add other shared database types here 