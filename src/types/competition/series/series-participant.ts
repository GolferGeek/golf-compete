import { SeriesRole } from './series-role';
import { SeriesParticipantStatus } from './series-participant-status';
import { Series } from './series';

/**
 * Represents a participant in a series, including their role and status
 */
export interface SeriesParticipant {
  id: string;
  series_id: string;
  user_id: string;
  role: SeriesRole;
  status: SeriesParticipantStatus;
  joined_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Joined fields when querying with user profile
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  // Joined fields when querying with series
  series?: Series;
} 