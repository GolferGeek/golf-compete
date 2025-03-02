import { supabase } from './supabase';
import { ParticipantStatus } from '@/types/events';

// Series Participants
export async function getSeriesParticipants(seriesId: string) {
  const { data, error } = await supabase
    .from('series_participants')
    .select(`
      id,
      user_id,
      series_id,
      role,
      status,
      created_at,
      users (
        id,
        email,
        first_name,
        last_name
      )
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
    throw error;
  }

  return data;
}

// Event Participants
export async function getEventParticipants(eventId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      id,
      user_id,
      event_id,
      status,
      created_at,
      users (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    throw error;
  }

  return data;
}

export async function addParticipantToEvent(
  eventId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'invited',
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function updateEventParticipantStatus(
  participantId: string,
  status: 'active' | 'withdrawn' | 'invited'
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

export async function getNonEventParticipants(eventId: string) {
  // Get all users who are not participants in the event
  const { data, error } = await supabase.rpc('get_non_event_participants', {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  return data;
} 