/**
 * Represents a tee time slot in an event
 */
export interface EventTeeTime {
  id: string;
  event_id: string;
  time: string;
  max_players: number;
  current_players: number;
  created_at: string;
  updated_at: string;
} 