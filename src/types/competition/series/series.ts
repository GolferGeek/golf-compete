import { SeriesEvent } from './series-event';
import { SeriesParticipant } from './series-participant';

/**
 * Represents the current status of a series
 */
export type SeriesStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Represents the type of series competition
 */
export type SeriesType = 'league' | 'tournament' | 'ladder';

/**
 * Represents a series competition
 */
export interface Series {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  status: SeriesStatus;
  type: SeriesType;
  scoring_type: 'gross' | 'net' | 'both';
  created_at: string;
  created_by: string;
  updated_at: string;
  series_events?: SeriesEvent[];
  series_participants?: SeriesParticipant[];
} 