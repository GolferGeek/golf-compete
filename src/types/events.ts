// import { Database } from './supabase';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type EventFormat = 'stroke_play' | 'match_play' | 'stableford' | 'scramble' | 'best_ball';
export type ScoringType = 'gross' | 'net' | 'both';
export type ParticipantStatus = 'registered' | 'confirmed' | 'withdrawn' | 'no_show';
export type ResultStatus = 'pending' | 'submitted' | 'verified' | 'disqualified';

export interface Event {
  id: string;
  name: string;
  description?: string;
  event_date: string;
  registration_close_date?: string;
  course_id: string;
  tee_set_id?: string;
  event_format: EventFormat;
  scoring_type: ScoringType;
  max_participants?: number;
  is_active: boolean;
  is_standalone: boolean;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  courses?: {
    name: string;
    city: string;
    state: string;
  };
  tee_sets?: {
    id: string;
    name: string;
    color: string;
    rating: number;
    slope: number;
  };
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: ParticipantStatus;
  tee_time: string | null;
  starting_hole: number | null;
  group_number: number | null;
  handicap_index: number | null;
}

export interface EventResult {
  id: string;
  event_id: string;
  user_id: string;
  gross_score: number | null;
  net_score: number | null;
  points: number | null;
  position: number | null;
  status: ResultStatus;
  scorecard: any | null; // JSONB type
  created_at: string;
  updated_at: string;
}

export interface SeriesEvent {
  id: string;
  series_id: string;
  event_id: string;
  event_order: number;
  points_multiplier: number;
}

export type EventWithCourse = Event & {
  course: {
    name: string;
    city: string;
    state: string;
  };
};

export type EventWithParticipants = Event & {
  participants: EventParticipant[];
};

export type EventWithResults = Event & {
  results: EventResult[];
};

export type EventWithSeries = Event & {
  series: {
    id: string;
    name: string;
  };
};

export type EventWithAll = Event & {
  course: {
    name: string;
    city: string;
    state: string;
  };
  participants: EventParticipant[];
  results: EventResult[];
  series?: {
    id: string;
    name: string;
  };
}; 