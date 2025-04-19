export type EventFormat = 'stroke' | 'match' | 'stableford';
export type ScoringType = 'gross' | 'net';
export type EventStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  series_id: string;
  name: string;
  description?: string;
  event_date: string;
  registration_open_date?: string;
  registration_close_date?: string;
  course_id: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at?: string;
  updated_at?: string;
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