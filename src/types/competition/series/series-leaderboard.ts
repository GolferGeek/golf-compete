/**
 * Represents a participant's standing in a series leaderboard
 */
export interface SeriesLeaderboard {
  participant_id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  total_points: number;
  events_played: number;
  average_score: number;
  best_finish: number;
  worst_finish: number;
  last_event_position?: number;
  last_event_points?: number;
} 