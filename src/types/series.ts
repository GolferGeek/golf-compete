export type SeriesType = 'season_long' | 'match_play' | 'tournament';
export type SeriesStatus = 'upcoming' | 'active' | 'completed';
export type EventFormat = 'stroke_play' | 'match_play' | 'stableford' | 'scramble' | 'best_ball';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type ScoringType = 'gross' | 'net' | 'both';
export type ParticipantRole = 'participant' | 'admin';
export type ParticipantStatus = 'active' | 'withdrawn' | 'invited';
export type EventParticipantStatus = 'registered' | 'confirmed' | 'withdrawn' | 'no_show';
export type EventResultStatus = 'pending' | 'submitted' | 'verified' | 'disqualified';
export type SeriesInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Series interface
export interface Series {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  series_type: SeriesType;
  scoring_system: Record<string, any> | null;
  status: SeriesStatus;
  created_at: string;
  created_by: string;
  updated_at: string;
  is_active: boolean;
}

// Event interface
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

// Series Participant interface
export interface SeriesParticipant {
  id: string;
  series_id: string;
  user_id: string;
  role: 'admin' | 'participant';
  status: 'active' | 'withdrawn' | 'invited';
  created_at: string;
  updated_at: string;
  // Additional fields for invitations
  series_name?: string;
  invited_by?: string;
  invited_by_name?: string;
  invited_at?: string;
  responded_at?: string;
  // User profile fields
  first_name?: string;
  last_name?: string;
  username?: string;
  handicap?: number;
  is_admin?: boolean;
}

// Series Event junction interface
export interface SeriesEvent {
  id: string;
  series_id: string;
  event_id: string;
  event_order: number;
  points_multiplier: number;
}

// Event Participant interface
export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: EventParticipantStatus;
  tee_time: string | null;
  starting_hole: number | null;
  group_number: number | null;
  handicap_index: number | null;
}

// Event Result interface
export interface EventResult {
  id: string;
  event_id: string;
  user_id: string;
  gross_score: number | null;
  net_score: number | null;
  points: number | null;
  position: number | null;
  status: EventResultStatus;
  scorecard: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Series Points interface
export interface SeriesPoints {
  id: string;
  series_id: string;
  user_id: string;
  event_id: string | null;
  points: number;
  position: number | null;
  created_at: string;
  updated_at: string;
}

// Series Invitation interface
export interface SeriesInvitation {
  id: string;
  series_id: string;
  user_id: string;
  invited_by: string | null;
  status: SeriesInvitationStatus;
  invited_at: string;
  responded_at: string | null;
  expires_at: string | null;
}

// Extended interfaces with related data
export interface SeriesWithEvents extends Series {
  events: Event[];
}

export interface SeriesWithParticipants extends Series {
  participants: SeriesParticipant[];
}

export interface EventWithParticipants extends Event {
  participants: EventParticipant[];
}

export interface EventWithResults extends Event {
  results: EventResult[];
} 