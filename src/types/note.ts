export interface UserNote {
  id: string;
  user_id: string;
  content: string;
  related_resource_id?: string;
  related_resource_type?: 'series' | 'event' | 'round' | 'course' | 'player';
  created_at: string;
  updated_at: string;
} 