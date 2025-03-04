import { supabase } from '@/lib/supabase';

// Types
export interface Event {
  id: string;
  series_id: string;
  name: string;
  description?: string;
  event_date: string;
  registration_open_date?: string;
  registration_close_date?: string;
  course_id: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  payment_status?: string;
  payment_date?: string;
  status: 'registered' | 'confirmed' | 'checked_in' | 'withdrawn' | 'no_show';
  created_at?: string;
  updated_at?: string;
}

export interface EventResult {
  id: string;
  event_id: string;
  user_id: string;
  gross_score: number;
  net_score?: number;
  position?: number;
  points?: number;
  disqualified: boolean;
  disqualification_reason?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all events for a series
 * @param seriesId The ID of the series
 * @returns Promise with the events
 */
export const fetchSeriesEvents = async (seriesId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
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
      .select('*')
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
      .select('*')
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
 * Creates a new event
 * @param eventData The event data
 * @returns Promise with the created event
 */
export const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data as unknown as Event;
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
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
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
 * @returns Promise with the result
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
      .select('*')
      .eq('event_id', eventId)
      .order('registration_date', { ascending: true });

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
 * Registers a participant for an event
 * @param participantData The participant data
 * @returns Promise with the registered participant
 */
export const registerEventParticipant = async (
  participantData: Omit<EventParticipant, 'id' | 'created_at' | 'updated_at'>
): Promise<EventParticipant> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .insert([participantData])
      .select()
      .single();

    if (error) {
      console.error('Error registering event participant:', error);
      throw error;
    }

    return data as unknown as EventParticipant;
  } catch (error) {
    console.error('Error in registerEventParticipant:', error);
    throw error;
  }
};

/**
 * Updates an event participant
 * @param participantId The ID of the participant
 * @param participantData The updated participant data
 * @returns Promise with the updated participant
 */
export const updateEventParticipant = async (
  participantId: string,
  participantData: Partial<EventParticipant>
): Promise<EventParticipant> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .update({
        ...participantData,
        updated_at: new Date().toISOString()
      })
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
 * @param participantId The ID of the participant
 * @returns Promise with the result
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
 * Checks if a user is registered for an event
 * @param eventId The ID of the event
 * @param userId The ID of the user
 * @returns Promise with the result
 */
export const isUserRegisteredForEvent = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, user is not registered
        return false;
      }
      console.error('Error checking event registration:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isUserRegisteredForEvent:', error);
    throw error;
  }
};

/**
 * Fetches results for an event
 * @param eventId The ID of the event
 * @returns Promise with the event results
 */
export const fetchEventResults = async (eventId: string): Promise<EventResult[]> => {
  try {
    const { data, error } = await supabase
      .from('event_results')
      .select('*')
      .eq('event_id', eventId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching event results:', error);
      throw error;
    }

    return data as unknown as EventResult[];
  } catch (error) {
    console.error('Error in fetchEventResults:', error);
    throw error;
  }
};

/**
 * Creates or updates an event result
 * @param resultData The result data
 * @returns Promise with the saved result
 */
export const saveEventResult = async (
  resultData: Omit<EventResult, 'id' | 'created_at' | 'updated_at'>
): Promise<EventResult> => {
  try {
    // Check if result already exists
    const { data: existingData, error: existingError } = await supabase
      .from('event_results')
      .select('id')
      .eq('event_id', resultData.event_id)
      .eq('user_id', resultData.user_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing result:', existingError);
      throw existingError;
    }

    // Define the type for existingData
    interface ExistingData {
      id: string;
    }

    if (existingData) {
      // Update existing result
      const { data, error } = await supabase
        .from('event_results')
        .update({
          ...resultData,
          updated_at: new Date().toISOString()
        })
        .eq('id', (existingData as ExistingData).id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating event result:', error);
        throw error;
      }
      
      return data as unknown as EventResult;
    } else {
      // Create new result
      const { data, error } = await supabase
        .from('event_results')
        .insert([resultData])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating event result:', error);
        throw error;
      }
      
      return data as unknown as EventResult;
    }
  } catch (error) {
    console.error('Error in saveEventResult:', error);
    throw error;
  }
};

/**
 * Deletes an event result
 * @param resultId The ID of the result
 * @returns Promise with the result
 */
export const deleteEventResult = async (resultId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('event_results')
      .delete()
      .eq('id', resultId);

    if (error) {
      console.error('Error deleting event result:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEventResult:', error);
    throw error;
  }
};

/**
 * Updates event status
 * @param eventId The ID of the event
 * @param status The new status
 * @returns Promise with the updated event
 */
export const updateEventStatus = async (
  eventId: string,
  status: Event['status']
): Promise<Event> => {
  return updateEvent(eventId, { status });
}; 