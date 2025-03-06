export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'light_rain' | 'heavy_rain' | 'windy';
export type CourseCondition = 'dry' | 'wet' | 'cart_path_only' | 'frost_delay';

export interface HoleScore {
    id: string;
    round_id: string;
    hole_number: number;
    strokes: number;
    putts: number;
    fairway_hit: boolean | null;  // null for par 3s
    green_in_regulation: boolean;
    penalty_strokes: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Round {
    id: string;
    user_id: string;
    event_id?: string;  // Optional for standalone rounds
    course_id: string;
    tee_set_id: string;
    bag_id: string;     // Added bag reference
    date_played: string;
    weather_conditions: WeatherCondition[];
    course_conditions: CourseCondition[];
    temperature_start?: number;
    temperature_end?: number;
    wind_speed_start?: number;
    wind_speed_end?: number;
    wind_direction_start?: string;
    wind_direction_end?: string;
    total_score: number;
    total_putts: number;
    fairways_hit: number;
    greens_in_regulation: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// Extended type that includes related data
export interface RoundWithDetails extends Round {
    course: {
        id: string;
        name: string;
        city: string;
        state: string;
    };
    tee_set: {
        id: string;
        name: string;
        color: string;
        par: number;
        rating: number;
        slope: number;
        yardage: number;
    };
    bag: {              // Added bag details
        id: string;
        name: string;
        description?: string;
    };
    hole_scores: HoleScore[];
    event?: {
        id: string;
        name: string;
        date: string;
    };
}

// Type for creating a new round
export interface CreateRoundInput {
    event_id?: string;
    course_id: string;
    tee_set_id: string;
    bag_id: string;     // Added required bag_id
    date_played?: string;  // Will default to now if not provided
    weather_conditions: WeatherCondition[];
    course_conditions: CourseCondition[];
    temperature_start?: number;
    temperature_end?: number;
    wind_speed_start?: number;
    wind_speed_end?: number;
    wind_direction_start?: string;
    wind_direction_end?: string;
    notes?: string;
}

// Type for updating an existing round
export interface UpdateRoundInput extends Partial<CreateRoundInput> {
    id: string;
    total_score?: number;
    total_putts?: number;
    fairways_hit?: number;
    greens_in_regulation?: number;
}

// Type for creating a new hole score
export interface CreateHoleScoreInput {
    round_id: string;
    hole_number: number;
    strokes: number;
    putts: number;
    fairway_hit?: boolean;
    green_in_regulation: boolean;
    penalty_strokes?: number;
    notes?: string;
}

// Type for updating an existing hole score
export interface UpdateHoleScoreInput extends Partial<Omit<CreateHoleScoreInput, 'round_id' | 'hole_number'>> {
    id: string;
    round_id: string;
    hole_number: number;
}

// Type for event round summary
export interface EventRoundSummary {
    event_id: string;
    rounds: {
        user_id: string;
        user_name: string;
        round_id: string;
        total_score: number;
        total_putts: number;
        fairways_hit: number;
        greens_in_regulation: number;
    }[];
} 