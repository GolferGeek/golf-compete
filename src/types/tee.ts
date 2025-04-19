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