/**
 * Represents a participant in an event, from invitation through completion
 */
export interface EventParticipant {
  id: string;
  event_id: string;
  participant_id: string;
  // Invitation flow
  invitation_status: 'invited' | 'accepted' | 'declined';
  invitation_date: string;
  response_date?: string;
  // Participation status (only set after accepting invitation)
  status?: 'checked_in' | 'started' | 'completed' | 'withdrawn';
  // Round and scoring
  round_id?: string;
  position?: number;
  points?: number;
  gross_score?: number;
  net_score?: number;
  // Metadata
  created_at: string;
  updated_at: string;
} 