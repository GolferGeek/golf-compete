export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'light_rain' | 'heavy_rain' | 'windy';
export type CourseCondition = 'dry' | 'wet' | 'cart_path_only' | 'frost_delay';

// Simplified Round interface for total score approach
export interface Round {
    id: string;
    user_id: string;
    course_id: string;
    course_tee_id: string;
    bag_id?: string;
    round_date: string;
    total_score?: number;
    weather_conditions?: string;
    course_conditions?: string;
    temperature?: number;
    wind_conditions?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// Extended type that includes related data
export interface RoundWithDetails extends Round {
    courses?: {
        id: string;
        name: string;
        description?: string;
    };
    tee_sets?: {
        id: string;
        name: string;
        color: string;
        men_rating?: number;
        women_rating?: number;
        men_slope?: number;
        women_slope?: number;
    };
    bags?: {
        id: string;
        name: string;
        description?: string;
    };
}

// Type for creating a new simplified round
export interface CreateRoundInput {
    course_id: string;
    course_tee_id: string;
    bag_id?: string;
    round_date?: string;
    total_score?: number;
    weather_conditions?: string;
    course_conditions?: string;
    temperature?: number;
    wind_conditions?: string;
    notes?: string;
}

// Type for updating an existing simplified round
export interface UpdateRoundInput {
    course_id?: string;
    course_tee_id?: string;
    bag_id?: string;
    round_date?: string;
    total_score?: number;
    weather_conditions?: string;
    course_conditions?: string;
    temperature?: number;
    wind_conditions?: string;
    notes?: string;
}

// Type for round summary/stats (simplified)
export interface RoundSummary {
    id: string;
    user_id: string;
    course_name: string;
    tee_name: string;
    tee_color: string;
    bag_name?: string;
    round_date: string;
    total_score?: number;
    course_rating?: number;
    slope_rating?: number;
}

// Type for handicap calculation (simplified)
export interface RoundForHandicap {
    id: string;
    total_score: number;
    course_rating: number;
    slope_rating: number;
    round_date: string;
}

// Legacy types for backward compatibility (deprecated)
/** @deprecated Use simplified Round interface instead */
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

/** @deprecated Use simplified Round interface instead */
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

/** @deprecated Use simplified Round interface instead */
export interface EventRoundSummary {
    event_id: string;
    rounds: RoundWithProfile[];
}

/** @deprecated Use simplified Round interface instead */
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