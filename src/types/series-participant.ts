export type ParticipantRole = 'participant' | 'admin';
export type ParticipantStatus = 'active' | 'withdrawn' | 'invited';

export interface SeriesParticipant {
  id: string;
  series_id: string;
  user_id: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
  // Additional fields for invitations
  series_name?: string;
  invited_by?: string;
  invited_by_name?: string;
  invited_at?: string;
  responded_at?: string;
  // User profile fields
  first_name?: string;
  last_name?: string;
  username?: string;
  handicap?: number;
  is_admin?: boolean;
} 