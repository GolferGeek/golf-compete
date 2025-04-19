export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface EventInvitation {
  id: string;
  event_id: string;
  user_id: string;
  email: string;
  status: InvitationStatus;
  invited_by: string;
  invited_at: string;
  responded_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
} 