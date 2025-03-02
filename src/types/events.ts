// import { Database } from './supabase';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type EventFormat = 'stroke_play' | 'match_play' | 'stableford' | 'scramble' | 'best_ball';
export type ScoringType = 'gross' | 'net' | 'both';
export type ParticipantStatus = 'registered' | 'confirmed' | 'withdrawn' | 'no_show';
export type ResultStatus = 'pending' | 'submitted' | 'verified' | 'disqualified';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  registration_close_date: string | null;
  course_id: string;
  event_format: EventFormat;
  status: EventStatus;
  max_participants: number | null;
  scoring_type: ScoringType;
  is_standalone: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  is_active: boolean;
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
    location: string;
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
    location: string;
  };
  participants: EventParticipant[];
  results: EventResult[];
  series?: {
    id: string;
    name: string;
  };
}; 