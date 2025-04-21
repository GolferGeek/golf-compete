import { Series } from './series';

/**
 * Represents the participation status of a participant in a series
 * This is separate from invitation_status and represents whether they are actively participating
 */
export type SeriesParticipantStatus = 'active' | 'inactive' | 'removed';

/**
 * Available roles a user can have in a series
 */
export type SeriesRole = 'admin' | 'organizer' | 'player';

/**
 * Represents a participant in a series, including their role, status, and invitation details
 */
export interface SeriesParticipant {
  id: string;
  series_id: string;
  participant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: SeriesRole;
  status: SeriesParticipantStatus;
  invitation_status: 'invited' | 'accepted' | 'declined';
  invitation_date: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  // Optional fields when joined with series
  series?: Series;
  // Scoring fields
  total_points?: number;
  position?: number;
  events_played?: number;
} 