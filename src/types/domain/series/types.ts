import { EventFormat, ScoringType } from '../event/types';
import { SeriesParticipant } from '../participant/types';

export type SeriesType = 'league' | 'tournament' | 'ladder';
export type SeriesStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Series {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  scoring_type: 'gross' | 'net' | 'both';
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface SeriesWithEvents extends Series {
  events: Event[];
}

export interface SeriesWithParticipants extends Series {
  participants: SeriesParticipant[];
}

export interface SeriesEvent {
  id: string;
  series_id: string;
  event_id: string;
  event_number: number;
  points_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface SeriesStanding {
  id: string;
  series_id: string;
  participant_id: string;
  total_points: number;
  events_played: number;
  rank: number;
  created_at: string;
  updated_at: string;
} 