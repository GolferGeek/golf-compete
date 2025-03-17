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
import { Event } from '@/types/events';
import { supabaseClient } from '@/lib/auth';
import { getEventById } from '@/lib/events';
import { getEventParticipants } from '@/lib/participants';

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
                profile_id: user.id
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
                course:courses(id, name, city, state),
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
    profile_id: string;
    total_score: number;
    total_putts: number;
    fairways_hit: number;
    greens_in_regulation: number;
    profile: {
        first_name: string;
        last_name: string;
    };
}

/**
 * Gets all rounds for an event
 */
export const getEventRounds = async (eventId: string): Promise<EventRoundSummary> => {
    try {
        console.log(`Getting rounds for event ID: ${eventId}`);
        
        // Get the rounds without relying on the join to profiles
        const { data: roundsData, error: roundsError } = await supabaseClient
            .from('rounds')
            .select(`
                id,
                profile_id,
                total_score,
                total_putts,
                fairways_hit,
                greens_in_regulation
            `)
            .eq('event_id', eventId);

        if (roundsError) {
            console.error('Error fetching rounds:', roundsError);
            throw roundsError;
        }

        console.log(`Found ${roundsData?.length || 0} rounds for event`);
        
        if (!roundsData || roundsData.length === 0) {
            return {
                event_id: eventId,
                rounds: []
            };
        }

        // Get profiles for each round separately
        const profileIds = roundsData.map(round => round.profile_id).filter(Boolean);
        console.log(`Getting profiles for IDs:`, profileIds);
        
        let profileData = {};
        
        if (profileIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabaseClient
                .from('profiles')
                .select('id, first_name, last_name, name')
                .in('id', profileIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                // Continue without profile data rather than failing
            } else if (profilesData) {
                // Create a map of profile IDs to profile data
                profileData = profilesData.reduce((acc, profile) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {});
            }
        }

        // Combine the data
        return {
            event_id: eventId,
            rounds: roundsData.map(round => {
                const profile = profileData[round.profile_id];
                let displayName = 'Player';
                
                if (profile) {
                    if (profile.first_name || profile.last_name) {
                        displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                    } else if (profile.name) {
                        displayName = profile.name;
                    }
                } else {
                    console.log(`No profile found for user ID: ${round.profile_id}`);
                }

                return {
                    user_id: round.profile_id, // Keep returning as user_id for backward compatibility
                    user_name: displayName,
                    round_id: round.id,
                    total_score: round.total_score,
                    total_putts: round.total_putts,
                    fairways_hit: round.fairways_hit,
                    greens_in_regulation: round.greens_in_regulation
                };
            })
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

/**
 * Initializes rounds for all participants in an event
 */
export const initializeEventRounds = async (eventId: string): Promise<EventRoundSummary> => {
    try {
        // Get event details to get the course and tee set
        const { data: event, error: eventError } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError || !event) throw new Error('Event not found');

        // Get all participants
        const participants = await getEventParticipants(eventId);
        if (!participants.length) throw new Error('No participants found for this event');

        // Create rounds for each participant
        const roundPromises = participants.map(async (participant) => {
            // Only create round if participant is confirmed
            if (participant.status !== 'confirmed') return null;

            // Get the default tee set for the course
            const { data: teeSets, error: teeSetError } = await supabaseClient
                .from('tee_sets')
                .select('id')
                .eq('course_id', event.course_id)
                .eq('is_default', true)
                .single();

            if (teeSetError) throw teeSetError;

            // Get the participant's default bag
            const { data: bags, error: bagError } = await supabaseClient
                .from('bags')
                .select('id')
                .eq('user_id', participant.user_id)
                .eq('is_default', true)
                .single();

            if (bagError) throw bagError;

            const roundInput: CreateRoundInput = {
                event_id: eventId,
                course_id: event.course_id,
                tee_set_id: teeSets.id,
                bag_id: bags.id,
                date_played: event.event_date,
                weather_conditions: [],
                course_conditions: [],
            };

            const { data: round, error } = await supabaseClient
                .from('rounds')
                .insert(roundInput)
                .select()
                .single();

            if (error) throw error;
            return round;
        });

        // Wait for all rounds to be created
        const rounds = await Promise.all(roundPromises);
        const validRounds = rounds.filter(r => r !== null);

        // Return the event rounds summary
        return await getEventRounds(eventId);
    } catch (error) {
        console.error('Error in initializeEventRounds:', error);
        throw error;
    }
}; 