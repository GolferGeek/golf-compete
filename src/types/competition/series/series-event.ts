/**
 * Represents the relationship between a series and an event
 */
export interface SeriesEvent {
  id: string;
  series_id: string;
  event_id: string;
  event_number: number;
  points_multiplier: number;
  created_at: string;
  updated_at: string;
} 