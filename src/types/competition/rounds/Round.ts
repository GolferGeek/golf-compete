export interface HoleScore {
  id: string;
  round_id: string;
  hole_number: number;
  strokes: number;
  putts: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Round {
  id: string;
  profile_id: string;
  event_id?: string;
  course_id: string;
  tee_set_id: string;
  total_score: number;
  total_putts: number;
  fairways_hit: number;
  greens_in_regulation: number;
  hole_scores: HoleScore[];
  created_at: Date;
  updated_at: Date;
}

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
    rating: number;
    slope: number;
    length: number;
  };
  hole_scores: HoleScore[];
  bag?: {
    id: string;
    name: string;
    description?: string;
  };
  event?: {
    id: string;
    name: string;
    event_date: string;
  };
}

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