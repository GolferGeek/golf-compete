/**
 * Represents a participant's standing in a specific series
 */
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