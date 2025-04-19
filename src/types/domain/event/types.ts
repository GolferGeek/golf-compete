export type EventFormat = 'stroke' | 'match' | 'stableford';
export type ScoringType = 'gross' | 'net';
export type EventStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  status: 'upcoming' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  scoring_type: 'gross' | 'net' | 'both';
  tee_time_interval: number; // in minutes
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  participant_id: string;
  status: 'registered' | 'checked_in' | 'started' | 'completed' | 'withdrawn';
  tee_time?: string;
  created_at: string;
  updated_at: string;
}

export interface EventScore {
  id: string;
  event_id: string;
  participant_id: string;
  gross_score: number;
  net_score: number;
  handicap_used: number;
  tee_time: string;
  status: 'registered' | 'checked_in' | 'started' | 'completed' | 'withdrawn';
  created_at: string;
  updated_at: string;
}

export interface TeeTime {
  id: string;
  event_id: string;
  time: string;
  max_players: number;
  current_players: number;
  created_at: string;
  updated_at: string;
}

export interface EventResult {
  id: string;
  event_id: string;
  participant_id: string;
  gross_score: number;
  net_score: number;
  points: number;
  rank: number;
  created_at: string;
  updated_at: string;
} 