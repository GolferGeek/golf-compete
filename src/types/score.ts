export interface Score {
  id: string;
  round_id: string;
  hole_number: number; 
  strokes: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
} 