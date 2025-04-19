export type ParticipantStatus = 'registered' | 'confirmed' | 'withdrawn' | 'no_show';

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: ParticipantStatus;
  tee_time: string | null;
  starting_hole: number | null;
  group_number: number | null;
  handicap_index: number | null;
  created_at: string;
  updated_at: string;
} 