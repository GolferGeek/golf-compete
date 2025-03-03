import { supabase } from './supabase';
import { ParticipantStatus } from '@/types/events';

// Series Participants
export async function getSeriesParticipants(seriesId: string) {
  const { data, error } = await supabase
    .from('series_participants_with_users')
    .select(`
      id,
      user_id,
      series_id,
      role,
      status,
      joined_at,
      first_name,
      last_name,
      username,
      handicap
    `)
    .eq('series_id', seriesId);

  if (error) {
    throw error;
  }

  return data;
}

export async function addParticipantToSeries(
  seriesId: string,
  userId: string,
  role: 'participant' | 'admin' = 'participant'
) {
  const { data, error } = await supabase
    .from('series_participants')
    .insert({
      series_id: seriesId,
      user_id: userId,
      role,
      status: 'invited',
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function updateSeriesParticipantRole(
  participantId: string,
  role: 'participant' | 'admin'
) {
  const { data, error } = await supabase
    .from('series_participants')
    .update({ role })
    .eq('id', participantId)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function updateSeriesParticipantStatus(
  participantId: string,
  status: 'active' | 'withdrawn' | 'invited'
) {
  const { data, error } = await supabase
    .from('series_participants')
    .update({ status })
    .eq('id', participantId)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function removeParticipantFromSeries(participantId: string) {
  const { error } = await supabase
    .from('series_participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    throw error;
  }

  return true;
}

export async function getNonSeriesParticipants(seriesId: string) {
  // Get all users who are not participants in the series
  const { data, error } = await supabase.rpc('get_non_series_participants', {
    p_series_id: seriesId,
  });

  if (error) {
    console.error('Error getting non-series participants:', error);
    
    // Fallback approach if the RPC function fails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username')
      .not('id', 'in', (subquery) => {
        return subquery
          .from('series_participants')
          .select('user_id')
          .eq('series_id', seriesId);
      });
    
    if (profilesError) {
      throw profilesError;
    }
    
    return profiles;
  }

  return data;
}

// Event Participants
export async function getEventParticipants(eventId: string) {
  const { data, error } = await supabase
    .from('event_participants_with_users')
    .select(`
      id,
      user_id,
      event_id,
      status,
      registration_date,
      tee_time,
      starting_hole,
      group_number,
      handicap_index,
      first_name,
      last_name,
      username,
      handicap
    `)
    .eq('event_id', eventId);

  if (error) {
    throw error;
  }

  return data;
}

export async function getNonEventParticipants(eventId: string) {
  // Try to use the stored procedure first
  const { data, error } = await supabase.rpc('get_non_event_participants', {
    p_event_id: eventId,
  });

  if (error) {
    console.error('Error getting non-event participants:', error);
    
    // Fallback approach if the RPC function fails
    // First get all participants in the event
    const { data: eventParticipants, error: participantsError } = await supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', eventId);

    if (participantsError) {
      throw participantsError;
    }

    // Get all users that are not in the event
    const participantIds = eventParticipants.map(p => p.user_id);
    
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, username, handicap');
    
    // Only filter if there are participants
    if (participantIds.length > 0) {
      query = query.not('id', 'in', participantIds);
    }
    
    const { data: users, error: usersError } = await query;

    if (usersError) {
      throw usersError;
    }

    return users;
  }

  return data;
}

export async function addParticipantToEvent(
  eventId: string,
  userId: string,
  handicapIndex?: number
) {
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'registered',
      registration_date: new Date().toISOString(),
      handicap_index: handicapIndex
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function updateEventParticipantStatus(
  participantId: string,
  status: 'registered' | 'confirmed' | 'withdrawn' | 'no_show'
) {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status })
    .eq('id', participantId)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function removeParticipantFromEvent(participantId: string) {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    throw error;
  }

  return true;
} 