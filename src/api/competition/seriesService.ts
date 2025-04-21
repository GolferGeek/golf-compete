import { createClient } from '@/lib/supabase/server';
import { Series, SeriesParticipant, SeriesRole, SeriesRoles } from '@/types/competition/series';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Fetches all series with optional pagination
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with the series
 */
export const fetchAllSeries = async (limit?: number, offset?: number): Promise<Series[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        series_participants (*)
      `)
      .order('start_date', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 100) - 1);

    if (error) {
      console.error('Error fetching series:', error);
      throw error;
    }

    return data as unknown as Series[];
  } catch (error) {
    console.error('Error in fetchAllSeries:', error);
    throw error;
  }
};

/**
 * Fetches active series
 * @param limit Optional limit for pagination
 * @returns Promise with the active series
 */
export const fetchActiveSeries = async (limit?: number): Promise<Series[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        series_participants (*)
      `)
      .eq('status', 'active')
      .order('start_date', { ascending: true })
      .limit(limit || 100);

    if (error) {
      console.error('Error fetching active series:', error);
      throw error;
    }

    return data as unknown as Series[];
  } catch (error) {
    console.error('Error in fetchActiveSeries:', error);
    throw error;
  }
};

/**
 * Fetches a series by ID
 * @param seriesId The ID of the series
 * @returns Promise with the series
 */
export const fetchSeriesById = async (seriesId: string): Promise<Series | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        series_participants (*)
      `)
      .eq('id', seriesId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as unknown as Series;
  } catch (error) {
    console.error('Error in fetchSeriesById:', error);
    throw error;
  }
};

/**
 * Creates a new series
 * @param seriesData The series data
 * @returns Promise with the created series
 */
export const createSeries = async (
  seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at' | 'series_participants' | 'series_events'>
): Promise<Series> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series')
      .insert([seriesData])
      .select()
      .single();

    if (error) {
      console.error('Error creating series:', error);
      throw error;
    }

    return data as unknown as Series;
  } catch (error) {
    console.error('Error in createSeries:', error);
    throw error;
  }
};

/**
 * Updates a series
 * @param seriesId The ID of the series
 * @param seriesData The updated series data
 * @returns Promise with the updated series
 */
export const updateSeries = async (
  seriesId: string,
  seriesData: Partial<Omit<Series, 'id' | 'created_at' | 'updated_at' | 'series_participants' | 'series_events'>>
): Promise<Series> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series')
      .update(seriesData)
      .eq('id', seriesId)
      .select()
      .single();

    if (error) {
      console.error('Error updating series:', error);
      throw error;
    }

    return data as unknown as Series;
  } catch (error) {
    console.error('Error in updateSeries:', error);
    throw error;
  }
};

/**
 * Deletes a series
 * @param seriesId The ID of the series
 * @returns Promise indicating success
 */
export const deleteSeries = async (seriesId: string): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', seriesId);

    if (error) {
      console.error('Error deleting series:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSeries:', error);
    throw error;
  }
};

/**
 * Gets the available roles for a series
 * @returns Array of available series roles
 */
export const getSeriesRoles = (): SeriesRole[] => {
  return Object.values(SeriesRoles);
};

/**
 * Fetches participants for a series
 * @param seriesId The ID of the series
 * @returns Promise with the series participants
 */
export const fetchSeriesParticipants = async (seriesId: string): Promise<SeriesParticipant[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series_participants')
      .select('*')
      .eq('series_id', seriesId);

    if (error) {
      console.error('Error fetching series participants:', error);
      throw error;
    }

    return data as unknown as SeriesParticipant[];
  } catch (error) {
    console.error('Error in fetchSeriesParticipants:', error);
    throw error;
  }
};

/**
 * Invites a participant to a series
 * @param seriesId The ID of the series
 * @param participantId The ID of the participant to invite
 * @returns Promise with the created series participant
 */
export const inviteSeriesParticipant = async (
  seriesId: string,
  participantId: string
): Promise<SeriesParticipant> => {
  try {
    const supabase = await createClient();
    const { data: existingParticipant } = await supabase
      .from('series_participants')
      .select()
      .eq('series_id', seriesId)
      .eq('participant_id', participantId)
      .single();

    if (existingParticipant) {
      throw new Error('Participant is already invited to this series');
    }

    const { data, error } = await supabase
      .from('series_participants')
      .insert({
        series_id: seriesId,
        participant_id: participantId,
        status: 'invited',
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting series participant:', error);
      throw error;
    }

    return data as unknown as SeriesParticipant;
  } catch (error) {
    console.error('Error in inviteSeriesParticipant:', error);
    throw error;
  }
};

/**
 * Updates a participant's status in a series
 * @param participantId The ID of the series participant
 * @param participantData The updated participant data
 * @returns Promise with the updated series participant
 */
export const updateSeriesParticipant = async (
  participantId: string,
  participantData: Partial<SeriesParticipant>
): Promise<SeriesParticipant> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series_participants')
      .update(participantData)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating series participant:', error);
      throw error;
    }

    return data as unknown as SeriesParticipant;
  } catch (error) {
    console.error('Error in updateSeriesParticipant:', error);
    throw error;
  }
};

/**
 * Removes a participant from a series
 * @param participantId The ID of the series participant to remove
 * @returns Promise indicating success
 */
export const removeSeriesParticipant = async (participantId: string): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('series_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Error removing series participant:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in removeSeriesParticipant:', error);
    throw error;
  }
};

/**
 * Checks if a participant is invited to a series
 * @param seriesId The ID of the series
 * @param participantId The ID of the participant
 * @returns Promise with boolean indicating if participant is invited
 */
export const isParticipantInvitedToSeries = async (
  seriesId: string,
  participantId: string
): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('series_participants')
      .select()
      .eq('series_id', seriesId)
      .eq('participant_id', participantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in isParticipantInvitedToSeries:', error);
    throw error;
  }
}; 