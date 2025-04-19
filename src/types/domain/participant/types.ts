export interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  handicap_index: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ParticipantPreferences {
  id: string;
  participant_id: string;
  preferred_tee_time: 'early' | 'mid' | 'late';
  notifications_enabled: boolean;
  notification_method: 'email' | 'sms' | 'both';
  created_at: string;
  updated_at: string;
}

export interface HandicapHistory {
  id: string;
  participant_id: string;
  handicap_index: number;
  effective_date: string;
  created_at: string;
}

export interface SeriesParticipant {
  id: string;
  series_id: string;
  participant_id: string;
  status: 'active' | 'inactive' | 'withdrawn';
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  participant_id: string;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'completed';
  registration_date: string;
  created_at: string;
  updated_at: string;
} 