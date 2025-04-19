export interface Course {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  amenities?: string;
  created_by?: string;
  created_at: string; 
  updated_at: string;
  is_active?: boolean;
  holes?: number;
  par?: number;
}

export interface CourseTee {
  id: string;
  course_id: string;
  tee_name: string;
  gender: 'Male' | 'Female' | 'Unisex';
  par: number;
  rating: number;
  slope_rating: number;
  yardage?: number;
}

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