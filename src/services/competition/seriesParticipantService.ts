import { SeriesParticipant } from '@/types/series';
import { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
const serviceClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface InviteUsersResult {
  success: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
}

type DatabaseParticipant = Database['public']['Tables']['series_participants']['Row'];

type ParticipantWithProfile = {
  id: string;
  series_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    handicap: number | null;
  } | null;
  series: {
    name: string;
  } | null;
};

/**
 * Get all participants for a series
 */
export async function getSeriesParticipants(seriesId: string): Promise<SeriesParticipant[]> {
  const supabase = createClientComponentClient<Database>();

  console.log('Fetching participants for series:', seriesId);
  const { data, error } = await supabase
    .from('series_participants')
    .select(`
      id,
      series_id,
      user_id,
      role,
      status,
      joined_at,
      profile:profiles!series_participants_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        handicap
      )
    `)
    .eq('series_id', seriesId);

  if (error) {
    console.error('Error fetching series participants:', error);
    throw new Error('Failed to fetch series participants');
  }

  if (!data) {
    console.log('No participants found');
    return [];
  }

  console.log('Raw participants data:', data);
  const mappedData = (data as unknown as ParticipantWithProfile[]).map(participant => ({
    id: participant.id,
    series_id: participant.series_id,
    user_id: participant.user_id,
    role: participant.role as SeriesParticipant['role'],
    status: participant.status as SeriesParticipant['status'],
    created_at: participant.joined_at,
    updated_at: participant.joined_at,
    first_name: participant.profile?.first_name || undefined,
    last_name: participant.profile?.last_name || undefined,
    username: participant.profile?.username || undefined,
    handicap: participant.profile?.handicap || undefined
  }));
  console.log('Mapped participants data:', mappedData);
  return mappedData;
}

/**
 * Get all invitations for a user
 */
export async function getUserInvitations(userId: string): Promise<SeriesParticipant[]> {
  const supabase = createClientComponentClient<Database>();

  const { data, error } = await supabase
    .from('series_participants')
    .select(`
      id,
      series_id,
      user_id,
      role,
      status,
      joined_at,
      profile:profiles!series_participants_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        handicap
      ),
      series:series_id (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'invited');

  if (error) {
    console.error('Error fetching user invitations:', error);
    throw error;
  }

  return (data as unknown as ParticipantWithProfile[]).map(participant => ({
    id: participant.id,
    series_id: participant.series_id,
    user_id: participant.user_id,
    role: participant.role as SeriesParticipant['role'],
    status: participant.status as SeriesParticipant['status'],
    created_at: participant.joined_at,
    updated_at: participant.joined_at,
    first_name: participant.profile?.first_name || undefined,
    last_name: participant.profile?.last_name || undefined,
    username: participant.profile?.username || undefined,
    handicap: participant.profile?.handicap || undefined,
    series_name: participant.series?.name
  }));
}

/**
 * Add users to a series with 'invited' status
 */
export const inviteUsers = async (seriesId: string, userIds: string[]): Promise<InviteUsersResult> => {
  console.log('Starting inviteUsers function');
  console.log('Adding users to series:', { seriesId, userIds });

  try {
    // Check if any of these users are already participants
    console.log('Checking for existing participants...');
    const { data: existingParticipants, error: existingError } = await serviceClient
      .from('series_participants')
      .select('user_id')
      .eq('series_id', seriesId)
      .in('user_id', userIds);

    if (existingError) {
      console.error('Error checking existing participants:', existingError);
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'Failed to check existing participants'
        }))
      };
    }

    const existingUserIds = existingParticipants?.map(p => p.user_id) || [];
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      console.log('All users are already participants');
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'User is already a participant'
        }))
      };
    }

    const participantsToAdd = newUserIds.map(userId => ({
      series_id: seriesId,
      user_id: userId,
      status: 'invited',
      role: 'participant',
      joined_at: new Date().toISOString()
    }));

    console.log('Participants to add:', participantsToAdd);
    console.log('Starting database insert...');

    const { data, error } = await serviceClient
      .from('series_participants')
      .insert(participantsToAdd)
      .select();

    console.log('Database insert completed');

    if (error) {
      console.error('Error adding participants:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: `Database error: ${error.message}`
        }))
      };
    }

    console.log('Successfully added participants:', data);
    return {
      success: data?.map(p => p.user_id) || [],
      failed: existingUserIds.map(id => ({
        userId: id,
        error: 'User is already a participant'
      }))
    };

  } catch (error) {
    console.error('Unexpected error in inviteUsers:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return {
      success: [],
      failed: userIds.map(id => ({
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
    };
  }
};

/**
 * Respond to an invitation
 */
export async function respondToInvitation(participantId: string, accept: boolean): Promise<void> {
  const supabase = createClientComponentClient<Database>();

  const { error } = await supabase
    .from('series_participants')
    .update({
      status: accept ? 'active' : 'declined',
      joined_at: accept ? new Date().toISOString() : null
    })
    .eq('id', participantId);

  if (error) {
    console.error('Error responding to invitation:', error);
    throw error;
  }
}

/**
 * Remove a participant from a series
 */
export async function removeParticipant(participantId: string): Promise<void> {
  const supabase = createClientComponentClient<Database>();

  const { error } = await supabase
    .from('series_participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
} 