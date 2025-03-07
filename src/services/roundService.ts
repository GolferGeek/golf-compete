import { 
    Round, 
    RoundWithDetails, 
    CreateRoundInput, 
    UpdateRoundInput,
    HoleScore,
    CreateHoleScoreInput,
    UpdateHoleScoreInput,
    EventRoundSummary
} from '@/types/round';
import { supabaseClient } from '@/lib/auth';

/**
 * Creates a new round
 */
export const createRound = async (input: CreateRoundInput): Promise<Round> => {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabaseClient
            .from('rounds')
            .insert({
                ...input,
                user_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in createRound:', error);
        throw error;
    }
};

/**
 * Updates an existing round
 */
export const updateRound = async (input: UpdateRoundInput): Promise<Round> => {
    try {
        const { id, ...updateData } = input;
        const { data, error } = await supabaseClient
            .from('rounds')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in updateRound:', error);
        throw error;
    }
};

/**
 * Gets a round by ID with all related details
 */
export const getRoundWithDetails = async (roundId: string): Promise<RoundWithDetails> => {
    try {
        // Get the round with course, tee set, and bag details
        const { data: round, error: roundError } = await supabaseClient
            .from('rounds')
            .select(`
                *,
                course:courses(id, name, location),
                tee_set:tee_sets(id, name, color, rating, slope, length),
                bag:bags(id, name, description),
                event:events!left(id, name, event_date)
            `)
            .eq('id', roundId)
            .single();

        if (roundError) throw roundError;

        // Get the hole scores
        const { data: holeScores, error: scoresError } = await supabaseClient
            .from('hole_scores')
            .select('*')
            .eq('round_id', roundId)
            .order('hole_number');

        if (scoresError) throw scoresError;

        return {
            ...round,
            hole_scores: holeScores || []
        };
    } catch (error) {
        console.error('Error in getRoundWithDetails:', error);
        throw error;
    }
};

interface RoundWithProfile {
    id: string;
    user_id: string;
    total_score: number;
    total_putts: number;
    fairways_hit: number;
    greens_in_regulation: number;
    profiles: {
        first_name: string;
        last_name: string;
    };
}

/**
 * Gets all rounds for an event
 */
export const getEventRounds = async (eventId: string): Promise<EventRoundSummary> => {
    try {
        const { data, error } = await supabaseClient
            .from('rounds')
            .select(`
                id,
                user_id,
                total_score,
                total_putts,
                fairways_hit,
                greens_in_regulation,
                profiles!inner(first_name, last_name)
            `)
            .eq('event_id', eventId);

        if (error) throw error;

        return {
            event_id: eventId,
            rounds: data.map(round => ({
                user_id: round.user_id,
                user_name: `${round.profiles.first_name} ${round.profiles.last_name}`,
                round_id: round.id,
                total_score: round.total_score,
                total_putts: round.total_putts,
                fairways_hit: round.fairways_hit,
                greens_in_regulation: round.greens_in_regulation
            }))
        };
    } catch (error) {
        console.error('Error in getEventRounds:', error);
        throw error;
    }
};

/**
 * Creates a new hole score
 */
export const createHoleScore = async (input: CreateHoleScoreInput): Promise<HoleScore> => {
    try {
        const { data, error } = await supabaseClient
            .from('hole_scores')
            .insert(input)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in createHoleScore:', error);
        throw error;
    }
};

/**
 * Updates an existing hole score
 */
export const updateHoleScore = async (input: UpdateHoleScoreInput): Promise<HoleScore> => {
    try {
        const { id, ...updateData } = input;
        const { data, error } = await supabaseClient
            .from('hole_scores')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in updateHoleScore:', error);
        throw error;
    }
}; 