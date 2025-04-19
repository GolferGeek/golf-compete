import { SeriesParticipant } from '@/types/series';

interface InviteUsersResult {
  success: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
}

/**
 * Get all participants for a series
 */
export async function getSeriesParticipants(seriesId: string): Promise<SeriesParticipant[]> {
  const response = await fetch(`/api/series/${seriesId}/participants`);
  if (!response.ok) {
    throw new Error('Failed to fetch series participants');
  }
  return response.json();
}

/**
 * Get all invitations for a user
 */
export async function getUserInvitations(userId: string): Promise<SeriesParticipant[]> {
  const response = await fetch(`/api/users/${userId}/invitations`);
  if (!response.ok) {
    throw new Error('Failed to fetch user invitations');
  }
  return response.json();
}

/**
 * Add users to a series with 'invited' status
 */
export const inviteUsers = async (
  seriesId: string, 
  userIds: string[], 
  role: 'participant' | 'admin' = 'participant'
): Promise<InviteUsersResult> => {
  const response = await fetch(`/api/series/${seriesId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds, role }),
  });

  if (!response.ok) {
    throw new Error('Failed to invite users');
  }

  return response.json();
};

/**
 * Respond to a series invitation
 */
export async function respondToInvitation(participantId: string, accept: boolean): Promise<void> {
  const response = await fetch(`/api/series/participants/${participantId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accept }),
  });

  if (!response.ok) {
    throw new Error('Failed to respond to invitation');
  }
}

/**
 * Remove a participant from a series
 */
export async function removeParticipant(participantId: string): Promise<void> {
  const response = await fetch(`/api/series/participants/${participantId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove participant');
  }
} 