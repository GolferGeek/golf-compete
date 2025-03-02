import { supabase } from './supabase';
import { Event, EventParticipant, SeriesEvent } from '@/types/events';

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

// Get event by ID
export async function getEventById(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*, courses(name, location)')
    .eq('id', eventId)
    .single();
  
  if (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
  
  return data;
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