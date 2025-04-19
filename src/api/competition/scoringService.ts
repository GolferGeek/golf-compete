import { supabase } from '@/lib/supabase';

// Types
export interface Score {
  id: string;
  event_id: string;
  user_id: string;
  hole_number: number;
  strokes: number;
  putts?: number;
  penalties?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Scorecard {
  event_id: string;
  user_id: string;
  course_id: string;
  tee_set_id?: string;
  scores: Score[];
  total_strokes: number;
  total_putts?: number;
  total_penalties?: number;
  fairways_hit?: number;
  greens_in_regulation?: number;
}

/**
 * Fetches scores for a user in an event
 * @param eventId The ID of the event
 * @param userId The ID of the user
 * @returns Promise with the scores
 */
export const fetchUserEventScores = async (eventId: string, userId: string): Promise<Score[]> => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .order('hole_number', { ascending: true });

    if (error) {
      console.error('Error fetching user event scores:', error);
      throw error;
    }

    return data as unknown as Score[];
  } catch (error) {
    console.error('Error in fetchUserEventScores:', error);
    throw error;
  }
};

/**
 * Fetches all scores for an event
 * @param eventId The ID of the event
 * @returns Promise with the scores grouped by user
 */
export const fetchEventScores = async (eventId: string): Promise<Record<string, Score[]>> => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('event_id', eventId)
      .order('hole_number', { ascending: true });

    if (error) {
      console.error('Error fetching event scores:', error);
      throw error;
    }

    // Group scores by user_id
    const scoresByUser: Record<string, Score[]> = {};
    (data as unknown as Score[]).forEach(score => {
      if (!scoresByUser[score.user_id]) {
        scoresByUser[score.user_id] = [];
      }
      scoresByUser[score.user_id].push(score);
    });

    return scoresByUser;
  } catch (error) {
    console.error('Error in fetchEventScores:', error);
    throw error;
  }
};

/**
 * Saves a score for a hole
 * @param scoreData The score data
 * @returns Promise with the saved score
 */
export const saveScore = async (scoreData: Omit<Score, 'id' | 'created_at' | 'updated_at'>): Promise<Score> => {
  try {
    // Check if score already exists
    const { data: existingData, error: existingError } = await supabase
      .from('scores')
      .select('id')
      .eq('event_id', scoreData.event_id)
      .eq('user_id', scoreData.user_id)
      .eq('hole_number', scoreData.hole_number)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing score:', existingError);
      throw existingError;
    }

    // Define the type for existingData
    interface ExistingData {
      id: string;
    }

    if (existingData) {
      // Update existing score
      const { data, error } = await supabase
        .from('scores')
        .update({
          ...scoreData,
          updated_at: new Date().toISOString()
        })
        .eq('id', (existingData as ExistingData).id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating score:', error);
        throw error;
      }
      
      return data as unknown as Score;
    } else {
      // Create new score
      const { data, error } = await supabase
        .from('scores')
        .insert([scoreData])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating score:', error);
        throw error;
      }
      
      return data as unknown as Score;
    }
  } catch (error) {
    console.error('Error in saveScore:', error);
    throw error;
  }
};

/**
 * Saves multiple scores at once
 * @param scores The scores to save
 * @returns Promise with the saved scores
 */
export const saveScores = async (scores: Omit<Score, 'id' | 'created_at' | 'updated_at'>[]): Promise<Score[]> => {
  try {
    const savedScores: Score[] = [];
    
    // Save each score individually
    for (const score of scores) {
      const savedScore = await saveScore(score);
      savedScores.push(savedScore);
    }
    
    return savedScores;
  } catch (error) {
    console.error('Error in saveScores:', error);
    throw error;
  }
};

/**
 * Deletes a score
 * @param scoreId The ID of the score
 * @returns Promise with the result
 */
export const deleteScore = async (scoreId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', scoreId);

    if (error) {
      console.error('Error deleting score:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteScore:', error);
    throw error;
  }
};

/**
 * Calculates a scorecard for a user in an event
 * @param eventId The ID of the event
 * @param userId The ID of the user
 * @param courseId The ID of the course
 * @param teeSetId Optional ID of the tee set
 * @returns Promise with the scorecard
 */
export const calculateScorecard = async (
  eventId: string,
  userId: string,
  courseId: string,
  teeSetId?: string
): Promise<Scorecard> => {
  try {
    const scores = await fetchUserEventScores(eventId, userId);
    
    // Calculate totals
    let totalStrokes = 0;
    let totalPutts = 0;
    let totalPenalties = 0;
    let fairwaysHit = 0;
    let greensInRegulation = 0;
    let fairwayCount = 0;
    let girCount = 0;
    
    scores.forEach(score => {
      totalStrokes += score.strokes;
      
      if (score.putts !== undefined) {
        totalPutts += score.putts;
      }
      
      if (score.penalties !== undefined) {
        totalPenalties += score.penalties;
      }
      
      if (score.fairway_hit !== undefined) {
        fairwayCount++;
        if (score.fairway_hit) {
          fairwaysHit++;
        }
      }
      
      if (score.green_in_regulation !== undefined) {
        girCount++;
        if (score.green_in_regulation) {
          greensInRegulation++;
        }
      }
    });
    
    return {
      event_id: eventId,
      user_id: userId,
      course_id: courseId,
      tee_set_id: teeSetId,
      scores,
      total_strokes: totalStrokes,
      total_putts: totalPutts || undefined,
      total_penalties: totalPenalties || undefined,
      fairways_hit: fairwayCount > 0 ? fairwaysHit : undefined,
      greens_in_regulation: girCount > 0 ? greensInRegulation : undefined
    };
  } catch (error) {
    console.error('Error in calculateScorecard:', error);
    throw error;
  }
};

/**
 * Calculates scorecards for all users in an event
 * @param eventId The ID of the event
 * @param courseId The ID of the course
 * @returns Promise with the scorecards
 */
export const calculateEventScorecards = async (
  eventId: string,
  courseId: string
): Promise<Record<string, Scorecard>> => {
  try {
    const scoresByUser = await fetchEventScores(eventId);
    const scorecards: Record<string, Scorecard> = {};
    
    for (const userId in scoresByUser) {
      const scores = scoresByUser[userId];
      
      // Calculate totals
      let totalStrokes = 0;
      let totalPutts = 0;
      let totalPenalties = 0;
      let fairwaysHit = 0;
      let greensInRegulation = 0;
      let fairwayCount = 0;
      let girCount = 0;
      
      scores.forEach(score => {
        totalStrokes += score.strokes;
        
        if (score.putts !== undefined) {
          totalPutts += score.putts;
        }
        
        if (score.penalties !== undefined) {
          totalPenalties += score.penalties;
        }
        
        if (score.fairway_hit !== undefined) {
          fairwayCount++;
          if (score.fairway_hit) {
            fairwaysHit++;
          }
        }
        
        if (score.green_in_regulation !== undefined) {
          girCount++;
          if (score.green_in_regulation) {
            greensInRegulation++;
          }
        }
      });
      
      scorecards[userId] = {
        event_id: eventId,
        user_id: userId,
        course_id: courseId,
        scores,
        total_strokes: totalStrokes,
        total_putts: totalPutts || undefined,
        total_penalties: totalPenalties || undefined,
        fairways_hit: fairwayCount > 0 ? fairwaysHit : undefined,
        greens_in_regulation: girCount > 0 ? greensInRegulation : undefined
      };
    }
    
    return scorecards;
  } catch (error) {
    console.error('Error in calculateEventScorecards:', error);
    throw error;
  }
}; 