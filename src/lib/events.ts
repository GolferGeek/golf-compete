import { supabase } from './supabase';
import { Event, EventParticipant, SeriesEvent } from '@/types/events';
import { Database } from '@/types/supabase';

type EventRow = Database['public']['Tables']['events']['Row'] & {
  courses: {
    name: string;
    city: string;
    state: string;
  } | null;
};

// Get all events
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, courses(name, location)')
    .eq('is_active', true)
    .order('event_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }
  
  return data;
}

interface EventResponse {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  registration_close_date: string | null;
  course_id: string;
  event_format: string;
  scoring_type: string;
  max_participants: number | null;
  is_active: boolean;
  is_standalone: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  courses: {
    name: string;
    city: string;
    state: string;
  } | null;
}

// Get event by ID
export async function getEventById(eventId: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      name,
      description,
      event_date,
      registration_close_date,
      course_id,
      event_format,
      scoring_type,
      max_participants,
      is_active,
      is_standalone,
      status,
      created_at,
      updated_at,
      courses:course_id (
        name,
        city,
        state
      )
    `)
    .eq('id', eventId)
    .single();
  
  if (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
  
  const eventData = data as EventRow;
  return {
    ...eventData,
    courses: eventData.courses || undefined
  } as Event;
}

// Get events for a series
export async function getEventsBySeries(seriesId: string) {
  const { data, error } = await supabase
    .from('series_events')
    .select('*, events(*, courses(name, location))')
    .eq('series_id', seriesId)
    .order('event_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching series events:', error);
    throw new Error('Failed to fetch series events');
  }
  
  return data.map((item: any) => ({
    ...item.events,
    event_order: item.event_order,
    points_multiplier: item.points_multiplier
  }));
}

// Create a new event
export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
  
  return data;
}

// Update an existing event
export async function updateEvent(eventId: string, eventData: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
  
  return data;
}

// Delete an event
export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
  
  return true;
}

// Add an event to a series
export async function addEventToSeries(seriesId: string, eventId: string, eventOrder: number = 0, pointsMultiplier: number = 1) {
  const { data, error } = await supabase
    .from('series_events')
    .insert({
      series_id: seriesId,
      event_id: eventId,
      event_order: eventOrder,
      points_multiplier: pointsMultiplier
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding event to series:', error);
    throw new Error('Failed to add event to series');
  }
  
  return data;
}

// Remove an event from a series
export async function removeEventFromSeries(seriesId: string, eventId: string) {
  const { error } = await supabase
    .from('series_events')
    .delete()
    .match({ series_id: seriesId, event_id: eventId });
  
  if (error) {
    console.error('Error removing event from series:', error);
    throw new Error('Failed to remove event from series');
  }
  
  return true;
}

// Get events not in a specific series
export async function getEventsNotInSeries(seriesId: string) {
  // First get all events in the series
  const { data: seriesEvents, error: seriesError } = await supabase
    .from('series_events')
    .select('event_id')
    .eq('series_id', seriesId);
  
  if (seriesError) {
    console.error('Error fetching series events:', seriesError);
    throw new Error('Failed to fetch series events');
  }
  
  // Get the event IDs that are already in the series
  const eventIds = seriesEvents.map((item: any) => item.event_id);
  
  // Then get all events that are not in the series
  const { data, error } = await supabase
    .from('events')
    .select('*, courses(name, location)')
    .eq('is_active', true)
    .not('id', 'in', eventIds.length > 0 ? `(${eventIds.join(',')})` : '(null)')
    .order('event_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching events not in series:', error);
    throw new Error('Failed to fetch events not in series');
  }
  
  return data;
}

// Get participants for an event
export async function getEventParticipants(eventId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .select('*, profiles(id, first_name, last_name, email, avatar_url)')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to fetch event participants');
  }
  
  return data;
}

// Add a participant to an event
export async function addParticipantToEvent(eventId: string, userId: string, status: EventParticipant['status'] = 'registered') {
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: status
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding participant to event:', error);
    throw new Error('Failed to add participant to event');
  }
  
  return data;
}

// Update a participant's status
export async function updateParticipantStatus(participantId: string, status: EventParticipant['status']) {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status })
    .eq('id', participantId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating participant status:', error);
    throw new Error('Failed to update participant status');
  }
  
  return data;
}

// Remove a participant from an event
export async function removeParticipantFromEvent(participantId: string) {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('id', participantId);
  
  if (error) {
    console.error('Error removing participant from event:', error);
    throw new Error('Failed to remove participant from event');
  }
  
  return true;
}

// Get event participants by user ID
export async function getEventParticipantsByUserId(userId: string) {
  // First get the event participant records
  const { data: participantsData, error: participantsError } = await supabase
    .from('event_participants')
    .select(`
      id,
      user_id,
      event_id,
      status,
      registration_date,
      tee_time,
      starting_hole,
      group_number,
      handicap_index
    `)
    .eq('user_id', userId);

  if (participantsError) {
    console.error('Error fetching event participants by user ID:', participantsError);
    throw participantsError;
  }

  if (!participantsData || participantsData.length === 0) {
    return [];
  }

  // Get the event details for each participant
  const eventIds = participantsData.map(p => p.event_id);
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      name,
      description,
      event_date,
      event_format,
      status,
      course_id
    `)
    .in('id', eventIds);

  if (eventsError) {
    console.error('Error fetching event details:', eventsError);
    throw eventsError;
  }

  // Combine the data
  return participantsData.map(participant => {
    const event = eventsData.find(e => e.id === participant.event_id);
    return {
      ...participant,
      name: event?.name || 'Unknown Event',
      description: event?.description,
      event_date: event?.event_date,
      event_format: event?.event_format,
      event_status: event?.status,
      course_id: event?.course_id
    };
  });
} 