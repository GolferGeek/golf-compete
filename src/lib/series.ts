import { supabase } from './supabase';
import { 
  Series, 
  Event, 
  SeriesParticipant, 
  SeriesEvent, 
  EventParticipant, 
  EventResult, 
  SeriesPoints,
  SeriesWithEvents,
  SeriesWithParticipants,
  EventWithParticipants,
  EventWithResults
} from '@/types/series';

// Helper function for type assertion
function assertType<T>(data: unknown): T {
  return data as T;
}

// Series API functions
export async function getAllSeries() {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('start_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching series:', error);
    throw error;
  }
  
  return assertType<Series[]>(data || []);
}

export async function getSeriesById(id: string) {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching series with ID ${id}:`, error);
    throw error;
  }
  
  return assertType<Series>(data);
}

export async function getSeriesWithEvents(id: string): Promise<SeriesWithEvents> {
  // First get the series
  const series = await getSeriesById(id);
  
  // Then get the events associated with this series
  const { data: seriesEvents, error: seriesEventsError } = await supabase
    .from('series_events')
    .select('event_id, event_order, points_multiplier')
    .eq('series_id', id)
    .order('event_order', { ascending: true });
  
  if (seriesEventsError) {
    console.error(`Error fetching events for series ${id}:`, seriesEventsError);
    throw seriesEventsError;
  }
  
  // If there are no events, return the series with an empty events array
  if (!seriesEvents || seriesEvents.length === 0) {
    return { ...series, events: [] };
  }
  
  // Get the event details for each event ID
  const eventIds = seriesEvents.map(se => se.event_id);
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds);
  
  if (eventsError) {
    console.error(`Error fetching event details for series ${id}:`, eventsError);
    throw eventsError;
  }
  
  // Sort events based on the event_order from series_events
  const sortedEvents = (events || []).map(event => {
    const seriesEvent = seriesEvents.find(se => se.event_id === event.id);
    return {
      ...event,
      event_order: seriesEvent?.event_order || 0,
      points_multiplier: seriesEvent?.points_multiplier || 1
    };
  }).sort((a, b) => Number(a.event_order) - Number(b.event_order));
  
  return { ...series, events: assertType<Event[]>(sortedEvents) };
}

export async function getSeriesWithParticipants(id: string): Promise<SeriesWithParticipants> {
  // First get the series
  const series = await getSeriesById(id);
  
  // Then get the participants for this series
  const { data: participants, error: participantsError } = await supabase
    .from('series_participants_with_users')
    .select('*')
    .eq('series_id', id);
  
  if (participantsError) {
    console.error(`Error fetching participants for series ${id}:`, participantsError);
    throw participantsError;
  }
  
  return { ...series, participants: assertType<SeriesParticipant[]>(participants || []) };
}

export async function createSeries(seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('series')
    .insert(seriesData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating series:', error);
    throw error;
  }

  // Add the creator as an admin participant
  if (data) {
    const series = assertType<Series>(data);
    try {
      await addParticipantToSeries(series.id, seriesData.created_by, 'admin');
    } catch (participantError) {
      console.error('Error adding creator as admin participant:', participantError);
      // Don't throw here - the series was created successfully
    }
  }
  
  return assertType<Series>(data);
}

export async function updateSeries(id: string, updates: Partial<Omit<Series, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) {
  const { data, error } = await supabase
    .from('series')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating series ${id}:`, error);
    throw error;
  }
  
  return assertType<Series>(data);
}

export async function deleteSeries(id: string) {
  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting series ${id}:`, error);
    throw error;
  }
  
  return true;
}

// Series Participants API functions
export async function addParticipantToSeries(seriesId: string, userId: string, role: SeriesParticipant['role'] = 'participant') {
  const { data, error } = await supabase
    .from('series_participants')
    .insert({
      series_id: seriesId,
      user_id: userId,
      role,
      status: 'active',
      joined_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error(`Error adding participant ${userId} to series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<SeriesParticipant>(data);
}

export async function removeParticipantFromSeries(seriesId: string, userId: string) {
  const { error } = await supabase
    .from('series_participants')
    .delete()
    .eq('series_id', seriesId)
    .eq('user_id', userId);
  
  if (error) {
    console.error(`Error removing participant ${userId} from series ${seriesId}:`, error);
    throw error;
  }
  
  return true;
}

export async function updateParticipantStatus(seriesId: string, userId: string, status: SeriesParticipant['status']) {
  const { data, error } = await supabase
    .from('series_participants')
    .update({ status })
    .eq('series_id', seriesId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating status for participant ${userId} in series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<SeriesParticipant>(data);
}

// Events API functions
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
  
  return assertType<Event[]>(data || []);
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw error;
  }
  
  return assertType<Event>(data);
}

export async function getEventWithParticipants(id: string): Promise<EventWithParticipants> {
  // First get the event
  const event = await getEventById(id);
  
  // Then get the participants for this event
  const { data: participants, error: participantsError } = await supabase
    .from('event_participants')
    .select('*, profiles:user_id(id, first_name, last_name, username, handicap)')
    .eq('event_id', id);
  
  if (participantsError) {
    console.error(`Error fetching participants for event ${id}:`, participantsError);
    throw participantsError;
  }
  
  return { ...event, participants: assertType<EventParticipant[]>(participants || []) };
}

export async function getEventWithResults(id: string): Promise<EventWithResults> {
  // First get the event
  const event = await getEventById(id);
  
  // Then get the results for this event
  const { data: results, error: resultsError } = await supabase
    .from('event_results')
    .select('*, profiles:user_id(id, first_name, last_name, username, handicap)')
    .eq('event_id', id)
    .order('position', { ascending: true });
  
  if (resultsError) {
    console.error(`Error fetching results for event ${id}:`, resultsError);
    throw resultsError;
  }
  
  return { ...event, results: assertType<EventResult[]>(results || []) };
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }
  
  return assertType<Event>(data);
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }
  
  return assertType<Event>(data);
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
  
  return true;
}

// Series Events API functions
export async function addEventToSeries(seriesId: string, eventId: string, eventOrder: number, pointsMultiplier: number = 1) {
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
    console.error(`Error adding event ${eventId} to series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<SeriesEvent>(data);
}

export async function removeEventFromSeries(seriesId: string, eventId: string) {
  const { error } = await supabase
    .from('series_events')
    .delete()
    .eq('series_id', seriesId)
    .eq('event_id', eventId);
  
  if (error) {
    console.error(`Error removing event ${eventId} from series ${seriesId}:`, error);
    throw error;
  }
  
  return true;
}

export async function updateEventInSeries(seriesId: string, eventId: string, updates: Partial<Pick<SeriesEvent, 'event_order' | 'points_multiplier'>>) {
  const { data, error } = await supabase
    .from('series_events')
    .update(updates)
    .eq('series_id', seriesId)
    .eq('event_id', eventId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating event ${eventId} in series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<SeriesEvent>(data);
}

// Event Participants API functions
export async function registerForEvent(eventId: string, userId: string, handicapIndex?: number) {
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      registration_date: new Date().toISOString(),
      status: 'registered',
      handicap_index: handicapIndex
    })
    .select()
    .single();
  
  if (error) {
    console.error(`Error registering user ${userId} for event ${eventId}:`, error);
    throw error;
  }
  
  return assertType<EventParticipant>(data);
}

export async function updateEventParticipant(eventId: string, userId: string, updates: Partial<Omit<EventParticipant, 'id' | 'event_id' | 'user_id' | 'registration_date'>>) {
  const { data, error } = await supabase
    .from('event_participants')
    .update(updates)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating participant ${userId} in event ${eventId}:`, error);
    throw error;
  }
  
  return assertType<EventParticipant>(data);
}

export async function withdrawFromEvent(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: 'withdrawn' })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error withdrawing user ${userId} from event ${eventId}:`, error);
    throw error;
  }
  
  return assertType<EventParticipant>(data);
}

// Event Results API functions
export async function submitEventResult(resultData: Omit<EventResult, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('event_results')
    .insert(resultData)
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting event result:', error);
    throw error;
  }
  
  return assertType<EventResult>(data);
}

export async function updateEventResult(eventId: string, userId: string, updates: Partial<Omit<EventResult, 'id' | 'event_id' | 'user_id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('event_results')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating result for user ${userId} in event ${eventId}:`, error);
    throw error;
  }
  
  return assertType<EventResult>(data);
}

// Series Points API functions
export async function getSeriesStandings(seriesId: string) {
  const { data, error } = await supabase
    .from('series_points')
    .select('*, profiles:user_id(id, first_name, last_name, username, handicap)')
    .eq('series_id', seriesId)
    .is('event_id', null)
    .order('position', { ascending: true });
  
  if (error) {
    console.error(`Error fetching standings for series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<(SeriesPoints & { profiles: any })[]>(data || []);
}

export async function getEventPointsForSeries(seriesId: string, eventId: string) {
  const { data, error } = await supabase
    .from('series_points')
    .select('*, profiles:user_id(id, first_name, last_name, username, handicap)')
    .eq('series_id', seriesId)
    .eq('event_id', eventId)
    .order('position', { ascending: true });
  
  if (error) {
    console.error(`Error fetching points for event ${eventId} in series ${seriesId}:`, error);
    throw error;
  }
  
  return assertType<(SeriesPoints & { profiles: any })[]>(data || []);
}

export async function updateSeriesPoints(pointsData: Omit<SeriesPoints, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('series_points')
    .upsert(
      { 
        ...pointsData, 
        updated_at: new Date().toISOString() 
      },
      { 
        onConflict: 'series_id,user_id,event_id',
        ignoreDuplicates: false
      }
    )
    .select()
    .single();
  
  if (error) {
    console.error('Error updating series points:', error);
    throw error;
  }
  
  return assertType<SeriesPoints>(data);
}

// Get series participants by user ID
export async function getSeriesParticipantsByUserId(userId: string) {
  console.log('Getting series participants for user:', userId);
  
  try {
    // First get the series participant records using the view
    console.log('Fetching series participant records...');
    const { data: participantsData, error: participantsError } = await supabase
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
      .eq('user_id', userId)
      .in('status', ['active', 'invited']); // Include both active and invited participants

    if (participantsError) {
      console.error('Error fetching series participants by user ID:', participantsError);
      throw participantsError;
    }

    console.log('Participants data received:', participantsData);

    if (!participantsData || participantsData.length === 0) {
      console.log('No series participants found for user');
      return [];
    }

    // Get the series details for each participant
    const seriesIds = participantsData.map(p => p.series_id);
    console.log('Fetching series details for series IDs:', seriesIds);
    
    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        created_by
      `)
      .in('id', seriesIds);

    if (seriesError) {
      console.error('Error fetching series details:', seriesError);
      throw seriesError;
    }

    console.log('Series data received:', seriesData);

    // Combine the data
    const result = participantsData.map(participant => {
      const series = seriesData.find(s => s.id === participant.series_id);
      return {
        ...participant,
        name: series?.name || 'Unknown Series',
        description: series?.description,
        start_date: series?.start_date,
        end_date: series?.end_date,
        series_status: series?.status,
        created_by: series?.created_by
      };
    });

    console.log('Final combined result:', result);
    return result;
  } catch (error) {
    console.error('Unexpected error in getSeriesParticipantsByUserId:', error);
    throw error;
  }
} 