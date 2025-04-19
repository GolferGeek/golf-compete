import { supabase } from '@/lib/supabase';
import { Event, EventParticipant } from '@/types/competition/events';

/**
 * Fetches all events for a series
 * @param seriesId The ID of the series
 * @returns Promise with the events
 */
export const fetchSeriesEvents = async (seriesId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants (*)
      `)
      .eq('series_id', seriesId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching series events:', error);
      throw error;
    }

    return data as unknown as Event[];
  } catch (error) {
    console.error('Error in fetchSeriesEvents:', error);
    throw error;
  }
};

/**
 * Fetches upcoming events
 * @param limit Optional limit for pagination
 * @returns Promise with the upcoming events
 */
export const fetchUpcomingEvents = async (limit?: number): Promise<Event[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants (*)
      `)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(limit || 10);

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }

    return data as unknown as Event[];
  } catch (error) {
    console.error('Error in fetchUpcomingEvents:', error);
    throw error;
  }
};

/**
 * Fetches an event by ID
 * @param eventId The ID of the event
 * @returns Promise with the event
 */
export const fetchEventById = async (eventId: string): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants (*)
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    return data as unknown as Event;
  } catch (error) {
    console.error('Error in fetchEventById:', error);
    throw error;
  }
};

/**
 * Invites series participants to an event
 * @param seriesId The ID of the series
 * @param eventId The ID of the event
 * @returns Promise with the result
 */
export const inviteSeriesParticipantsToEvent = async (seriesId: string, eventId: string): Promise<boolean> => {
  try {
    // First get all series participants
    const { data: seriesParticipants, error: seriesError } = await supabase
      .from('series_participants')
      .select('participant_id')
      .eq('series_id', seriesId)
      .eq('status', 'active');

    if (seriesError) {
      console.error('Error fetching series participants:', seriesError);
      throw seriesError;
    }

    if (!seriesParticipants || seriesParticipants.length === 0) {
      return true; // No participants to invite
    }

    // Create event participants for each series participant
    const eventParticipants = seriesParticipants.map(participant => ({
      event_id: eventId,
      participant_id: participant.participant_id,
      invitation_status: 'invited',
      invitation_date: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('event_participants')
      .insert(eventParticipants);

    if (insertError) {
      console.error('Error inviting participants to event:', insertError);
      throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error in inviteSeriesParticipantsToEvent:', error);
    throw error;
  }
};

/**
 * Creates a new event and associates it with a series
 * @param eventData The event data
 * @param seriesId The ID of the series to associate the event with
 * @returns Promise with the created event
 */
export const createEvent = async (
  eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>,
  seriesId: string
): Promise<Event> => {
  try {
    // Start a transaction
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    if (!newEvent) {
      throw new Error('No event data returned after creation');
    }

    const createdEvent = newEvent as unknown as Event;

    // Get the current highest event_order for this series
    const { data: maxOrderData } = await supabase
      .from('series_events')
      .select('event_order')
      .eq('series_id', seriesId)
      .order('event_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = ((maxOrderData?.event_order as number) || 0) + 1;

    // Create the series_events entry
    const { error: seriesEventError } = await supabase
      .from('series_events')
      .insert([{
        series_id: seriesId,
        event_id: createdEvent.id,
        event_order: nextOrder
      }]);

    if (seriesEventError) {
      console.error('Error creating series event:', seriesEventError);
      // Rollback by deleting the event
      await supabase.from('events').delete().eq('id', createdEvent.id);
      throw seriesEventError;
    }

    // Invite series participants to the event
    await inviteSeriesParticipantsToEvent(seriesId, createdEvent.id);

    return createdEvent;
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

/**
 * Updates an event
 * @param eventId The ID of the event
 * @param eventData The updated event data
 * @returns Promise with the updated event
 */
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data as unknown as Event;
  } catch (error) {
    console.error('Error in updateEvent:', error);
    throw error;
  }
};

/**
 * Deletes an event
 * @param eventId The ID of the event
 * @returns Promise indicating success
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    throw error;
  }
};

/**
 * Fetches participants for an event
 * @param eventId The ID of the event
 * @returns Promise with the event participants
 */
export const fetchEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        rounds (*)
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event participants:', error);
      throw error;
    }

    return data as unknown as EventParticipant[];
  } catch (error) {
    console.error('Error in fetchEventParticipants:', error);
    throw error;
  }
};

/**
 * Invites a participant to an event
 * @param eventId The ID of the event
 * @param participantId The ID of the participant to invite
 * @returns Promise with the created event participant
 */
export const inviteEventParticipant = async (
  eventId: string,
  participantId: string
): Promise<EventParticipant> => {
  try {
    const participantData = {
      event_id: eventId,
      participant_id: participantId,
      invitation_status: 'invited',
      invitation_date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('event_participants')
      .insert([participantData])
      .select()
      .single();

    if (error) {
      console.error('Error inviting event participant:', error);
      throw error;
    }

    return data as unknown as EventParticipant;
  } catch (error) {
    console.error('Error in inviteEventParticipant:', error);
    throw error;
  }
};

/**
 * Updates a participant's status in an event
 * @param participantId The ID of the event participant
 * @param participantData The updated participant data
 * @returns Promise with the updated event participant
 */
export const updateEventParticipant = async (
  participantId: string,
  participantData: Partial<EventParticipant>
): Promise<EventParticipant> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .update(participantData)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event participant:', error);
      throw error;
    }

    return data as unknown as EventParticipant;
  } catch (error) {
    console.error('Error in updateEventParticipant:', error);
    throw error;
  }
};

/**
 * Removes a participant from an event
 * @param participantId The ID of the event participant to remove
 * @returns Promise indicating success
 */
export const removeEventParticipant = async (participantId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Error removing event participant:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in removeEventParticipant:', error);
    throw error;
  }
};

/**
 * Checks if a user is invited to an event
 * @param eventId The ID of the event
 * @param participantId The ID of the participant
 * @returns Promise with boolean indicating if user is invited
 */
export const isUserInvitedToEvent = async (eventId: string, participantId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('participant_id', participantId)
      .maybeSingle();

    if (error) {
      console.error('Error checking event invitation:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isUserInvitedToEvent:', error);
    throw error;
  }
};

/**
 * Updates an event's status
 * @param eventId The ID of the event
 * @param status The new status
 * @returns Promise with the updated event
 */
export const updateEventStatus = async (
  eventId: string,
  status: Event['status']
): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event status:', error);
      throw error;
    }

    return data as unknown as Event;
  } catch (error) {
    console.error('Error in updateEventStatus:', error);
    throw error;
  }
}; 