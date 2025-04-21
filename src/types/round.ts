import { Database } from './supabase';

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'light_rain' | 'heavy_rain' | 'windy';
export type CourseCondition = 'dry' | 'wet' | 'cart_path_only' | 'frost_delay';

export interface RoundHole {
    id: string;
    round_id: string;
    hole_number: number;
    score?: number;
    putts?: number;
    fairway_hit?: boolean;
    green_in_regulation?: boolean;
    penalties?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Round {
    id: string;
    profile_id: string;
    course_id: string;
    bag_id?: string;
    round_date: string;
    status: 'draft' | 'in_progress' | 'completed';
    handicap_index_used?: number;
    course_handicap?: number;
    net_score?: number;
    gross_score?: number;
    created_at: string;
    updated_at: string;
    holes?: RoundHole[];
}

// Extended type that includes related data
export interface RoundWithDetails extends Round {
    course: Database['public']['Tables']['courses']['Row'];
    bag?: Database['public']['Tables']['bags']['Row'];
}

// Type for creating a new round
export interface CreateRoundInput {
    profile_id: string;
    course_id: string;
    bag_id?: string;
    round_date: string;
    status?: 'draft' | 'in_progress' | 'completed';
    handicap_index_used?: number;
    course_handicap?: number;
}

// Type for updating an existing round
export interface UpdateRoundInput {
    course_id?: string;
    bag_id?: string;
    round_date?: string;
    status?: 'draft' | 'in_progress' | 'completed';
    handicap_index_used?: number;
    course_handicap?: number;
}

// Type for creating a new hole score
export interface CreateRoundHoleInput {
    round_id: string;
    hole_number: number;
    score?: number;
    putts?: number;
    fairway_hit?: boolean;
    green_in_regulation?: boolean;
    penalties?: number;
    notes?: string;
}

// Type for updating an existing hole score
export interface UpdateRoundHoleInput {
    score?: number;
    putts?: number;
    fairway_hit?: boolean;
    green_in_regulation?: boolean;
    penalties?: number;
    notes?: string;
}

// Type for round with profile information (for leaderboards/summaries)
export interface RoundWithProfile {
    id: string;
    profile_id: string;
    total_score: number;
    total_putts: number;
    fairways_hit: number;
    greens_in_regulation: number;
    profile: {
        first_name: string;
        last_name: string;
    };
}

// Type for event round summary
export interface EventRoundSummary {
    event_id: string;
    rounds: RoundWithProfile[];
}

export interface RoundStats {
    total_putts?: number;
    fairways_hit?: number;
    total_fairways?: number;
    fairways_hit_percentage?: number;
    greens_in_regulation?: number;
    total_greens?: number;
    greens_in_regulation_percentage?: number;
    total_penalties?: number;
} 