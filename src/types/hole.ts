export interface Hole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
  handicap_index: number;
  yards?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
} 