import { supabase } from '@/lib/supabase';

// Types
export interface Series {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_open_date?: string;
  registration_close_date?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  is_active: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeriesRule {
  id: string;
  series_id: string;
  rule_type: string;
  rule_value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeriesParticipant {
  id: string;
  series_id: string;
  user_id: string;
  registration_date: string;
  payment_status?: string;
  payment_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all series with optional pagination
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with the series
 */
export const fetchAllSeries = async (limit?: number, offset?: number): Promise<Series[]> => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
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
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('is_active', true)
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
export const fetchSeriesById = async (seriesId: string): Promise<Series> => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', seriesId)
      .single();

    if (error) {
      console.error('Error fetching series:', error);
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
export const createSeries = async (seriesData: Omit<Series, 'id' | 'created_at' | 'updated_at'>): Promise<Series> => {
  try {
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
export const updateSeries = async (seriesId: string, seriesData: Partial<Series>): Promise<Series> => {
  try {
    const { data, error } = await supabase
      .from('series')
      .update({
        ...seriesData,
        updated_at: new Date().toISOString()
      })
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
 * @returns Promise with the result
 */
export const deleteSeries = async (seriesId: string): Promise<boolean> => {
  try {
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
 * Fetches rules for a series
 * @param seriesId The ID of the series
 * @returns Promise with the series rules
 */
export const fetchSeriesRules = async (seriesId: string): Promise<SeriesRule[]> => {
  try {
    const { data, error } = await supabase
      .from('series_rules')
      .select('*')
      .eq('series_id', seriesId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching series rules:', error);
      throw error;
    }

    return data as unknown as SeriesRule[];
  } catch (error) {
    console.error('Error in fetchSeriesRules:', error);
    throw error;
  }
};

/**
 * Creates a new series rule
 * @param ruleData The rule data
 * @returns Promise with the created rule
 */
export const createSeriesRule = async (ruleData: Omit<SeriesRule, 'id' | 'created_at' | 'updated_at'>): Promise<SeriesRule> => {
  try {
    const { data, error } = await supabase
      .from('series_rules')
      .insert([ruleData])
      .select()
      .single();

    if (error) {
      console.error('Error creating series rule:', error);
      throw error;
    }

    return data as unknown as SeriesRule;
  } catch (error) {
    console.error('Error in createSeriesRule:', error);
    throw error;
  }
};

/**
 * Updates a series rule
 * @param ruleId The ID of the rule
 * @param ruleData The updated rule data
 * @returns Promise with the updated rule
 */
export const updateSeriesRule = async (ruleId: string, ruleData: Partial<SeriesRule>): Promise<SeriesRule> => {
  try {
    const { data, error } = await supabase
      .from('series_rules')
      .update({
        ...ruleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating series rule:', error);
      throw error;
    }

    return data as unknown as SeriesRule;
  } catch (error) {
    console.error('Error in updateSeriesRule:', error);
    throw error;
  }
};

/**
 * Deletes a series rule
 * @param ruleId The ID of the rule
 * @returns Promise with the result
 */
export const deleteSeriesRule = async (ruleId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('series_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting series rule:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSeriesRule:', error);
    throw error;
  }
};

/**
 * Fetches participants for a series
 * @param seriesId The ID of the series
 * @returns Promise with the series participants
 */
export const fetchSeriesParticipants = async (seriesId: string): Promise<SeriesParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('series_participants')
      .select('*')
      .eq('series_id', seriesId)
      .order('registration_date', { ascending: true });

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
 * Registers a participant for a series
 * @param participantData The participant data
 * @returns Promise with the registered participant
 */
export const registerSeriesParticipant = async (
  participantData: Omit<SeriesParticipant, 'id' | 'created_at' | 'updated_at'>
): Promise<SeriesParticipant> => {
  try {
    const { data, error } = await supabase
      .from('series_participants')
      .insert([participantData])
      .select()
      .single();

    if (error) {
      console.error('Error registering series participant:', error);
      throw error;
    }

    return data as unknown as SeriesParticipant;
  } catch (error) {
    console.error('Error in registerSeriesParticipant:', error);
    throw error;
  }
};

/**
 * Updates a series participant
 * @param participantId The ID of the participant
 * @param participantData The updated participant data
 * @returns Promise with the updated participant
 */
export const updateSeriesParticipant = async (
  participantId: string,
  participantData: Partial<SeriesParticipant>
): Promise<SeriesParticipant> => {
  try {
    const { data, error } = await supabase
      .from('series_participants')
      .update({
        ...participantData,
        updated_at: new Date().toISOString()
      })
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
 * @param participantId The ID of the participant
 * @returns Promise with the result
 */
export const removeSeriesParticipant = async (participantId: string): Promise<boolean> => {
  try {
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
 * Checks if a user is registered for a series
 * @param seriesId The ID of the series
 * @param userId The ID of the user
 * @returns Promise with the result
 */
export const isUserRegisteredForSeries = async (seriesId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('series_participants')
      .select('id')
      .eq('series_id', seriesId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, user is not registered
        return false;
      }
      console.error('Error checking series registration:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isUserRegisteredForSeries:', error);
    throw error;
  }
}; 