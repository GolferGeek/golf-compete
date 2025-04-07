import { SeriesParticipant } from '@/types/series';
import { Database } from '@/types/supabase';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

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
  const supabase = getSupabaseBrowserClient();

  console.log('Fetching participants for series:', seriesId);
  const { data, error } = await supabase
    .from('series_participants_with_profiles')
    .select('*')
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
  const mappedData = data.map(participant => ({
    id: participant.id,
    series_id: participant.series_id,
    user_id: participant.user_id,
    role: participant.role as SeriesParticipant['role'],
    status: participant.status as SeriesParticipant['status'],
    created_at: participant.joined_at || new Date().toISOString(),
    updated_at: participant.joined_at || new Date().toISOString(),
    first_name: participant.first_name || undefined,
    last_name: participant.last_name || undefined,
    username: participant.username || undefined,
    handicap: participant.handicap || undefined,
    series_name: participant.series_name,
    series_description: participant.series_description,
    start_date: participant.start_date,
    end_date: participant.end_date,
    series_status: participant.series_status
  }));
  console.log('Mapped participants data:', mappedData);
  return mappedData;
}

/**
 * Get all invitations for a user
 */
export async function getUserInvitations(userId: string): Promise<SeriesParticipant[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('series_participants_with_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'invited');

  if (error) {
    console.error('Error fetching user invitations:', error);
    throw error;
  }

  return data.map(participant => ({
    id: participant.id,
    series_id: participant.series_id,
    user_id: participant.user_id,
    role: participant.role as SeriesParticipant['role'],
    status: participant.status as SeriesParticipant['status'],
    created_at: participant.joined_at || new Date().toISOString(),
    updated_at: participant.joined_at || new Date().toISOString(),
    first_name: participant.first_name || undefined,
    last_name: participant.last_name || undefined,
    username: participant.username || undefined,
    handicap: participant.handicap || undefined,
    series_name: participant.series_name,
    series_description: participant.series_description,
    start_date: participant.start_date,
    end_date: participant.end_date,
    series_status: participant.series_status
  }));
}

/**
 * Add users to a series with 'invited' status
 */
export const inviteUsers = async (seriesId: string, userIds: string[], role: 'participant' | 'admin' = 'participant'): Promise<InviteUsersResult> => {
  const supabase = getSupabaseBrowserClient();
  console.log('Starting inviteUsers function');
  console.log('Adding users to series:', { seriesId, userIds, role });

  try {
    // First check if the current user has admin rights for this series
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'Not authenticated'
        }))
      };
    }

    // Check if user is the series creator
    console.log('Checking if user is series creator:', user.id);
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('created_by')
      .eq('id', seriesId)
      .single();

    if (seriesError) {
      console.error('Error checking series creator:', seriesError);
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'Failed to verify admin rights'
        }))
      };
    }

    const isCreator = series.created_by === user.id;
    if (!isCreator) {
      console.error('User is not the series creator');
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'You do not have permission to add participants'
        }))
      };
    }

    // Check if any of these users are already participants using the view
    console.log('Checking for existing participants...');
    const { data: existingParticipants, error: existingError } = await supabase
      .from('series_participants_with_profiles')
      .select('user_id')
      .eq('series_id', seriesId)
      .in('user_id', userIds);

    if (existingError) {
      console.error('Error checking existing participants:', existingError);
      console.error('Error details:', {
        message: existingError.message,
        code: existingError.code,
        details: existingError.details,
        hint: existingError.hint
      });
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

    // Use the RPC function to get non-participants
    console.log('Getting non-participants using RPC function...');
    const { data: availableUsers, error: rpcError } = await supabase
      .rpc('get_non_series_participants', { p_series_id: seriesId });

    if (rpcError) {
      console.error('Error getting non-participants:', rpcError);
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'Failed to verify available users'
        }))
      };
    }

    const availableUserIds = availableUsers?.map(u => u.id) || [];
    const validUserIds = newUserIds.filter(id => availableUserIds.includes(id));

    if (validUserIds.length === 0) {
      console.log('No valid users to add');
      return {
        success: [],
        failed: userIds.map(id => ({
          userId: id,
          error: 'User is not available to add'
        }))
      };
    }

    const participantsToAdd = validUserIds.map(userId => ({
      series_id: seriesId,
      user_id: userId,
      status: 'invited',
      role: role,
      joined_at: new Date().toISOString()
    }));

    console.log('Participants to add:', participantsToAdd);
    console.log('Starting database insert...');

    const { data, error } = await supabase
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
  const supabase = getSupabaseBrowserClient();

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
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from('series_participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
} 