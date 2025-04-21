import { 
    Round, 
    RoundWithDetails, 
    CreateRoundInput, 
    UpdateRoundInput,
    HoleScore,
    CreateHoleScoreInput,
    UpdateHoleScoreInput,
    EventRoundSummary,
    WeatherCondition,
    CourseCondition
} from '@/types/round';
import { Event } from '@/types/competition/events/event';
import { supabaseClient } from '@/lib/auth';
import { getEventById } from '@/lib/events';
import { getEventParticipants } from '@/lib/participants';
import { CoursesApiClient } from '@/lib/apiClient/courses';
import { RoundsApiClient } from '@/lib/apiClient/rounds';

/**
 * Creates a new round
 */
export const createRound = async (input: CreateRoundInput): Promise<Round> => {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not authenticated');

        // Convert date to ISO string if provided
        const roundDate = input.date_played || new Date().toISOString();

        const response = await RoundsApiClient.createRound({
            courseTeeId: input.tee_set_id,
            roundDate,
            status: 'draft'
        });

        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to create round');
        }

        // Construct Round object with all required properties
        return {
            id: response.data.id,
            user_id: response.data.userId,
            course_id: response.data.course?.id || '',
            bag_id: input.bag_id,
            tee_set_id: response.data.courseTeeId,
            date_played: roundDate,
            weather_conditions: input.weather_conditions || [],
            course_conditions: input.course_conditions || [],
            temperature_start: input.temperature_start,
            temperature_end: input.temperature_end,
            wind_speed_start: input.wind_speed_start,
            wind_speed_end: input.wind_speed_end,
            wind_direction_start: input.wind_direction_start,
            wind_direction_end: input.wind_direction_end,
            total_score: 0,
            total_putts: 0,
            fairways_hit: 0,
            greens_in_regulation: 0,
            notes: input.notes || '',
            created_at: response.data.createdAt,
            updated_at: response.data.updatedAt
        };
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
        
        const response = await RoundsApiClient.updateRound(id, {
            courseTeeId: updateData.tee_set_id,
            roundDate: updateData.date_played,
            status: 'draft'
        });

        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to update round');
        }

        // Ensure all required Round properties are present
        return {
            id: response.data.id,
            user_id: response.data.userId,
            course_id: response.data.course?.id || '',
            bag_id: updateData.bag_id || response.data.bag_id || '',
            tee_set_id: response.data.courseTeeId,
            date_played: updateData.date_played || response.data.roundDate,
            weather_conditions: updateData.weather_conditions || [],
            course_conditions: updateData.course_conditions || [],
            temperature_start: updateData.temperature_start,
            temperature_end: updateData.temperature_end,
            wind_speed_start: updateData.wind_speed_start,
            wind_speed_end: updateData.wind_speed_end,
            wind_direction_start: updateData.wind_direction_start,
            wind_direction_end: updateData.wind_direction_end,
            total_score: 0,
            total_putts: 0,
            fairways_hit: 0,
            greens_in_regulation: 0,
            notes: updateData.notes || '',
            created_at: response.data.createdAt,
            updated_at: response.data.updatedAt
        };
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
        // Get round with scores
        const roundResponse = await RoundsApiClient.getRoundById(roundId, true);
        if (!roundResponse.success || !roundResponse.data) {
            throw new Error(roundResponse.error?.message || 'Round not found');
        }

        // Get course details using API client
        const courseResponse = await CoursesApiClient.getCourseById(roundResponse.data.course?.id);
        if (!courseResponse.success || !courseResponse.data) {
            throw new Error('Failed to fetch course details');
        }

        // Get tee set details using API client
        const teeResponse = await CoursesApiClient.getCourseTees(roundResponse.data.course?.id);
        if (!teeResponse.success || !teeResponse.data || !teeResponse.data.tees) {
            throw new Error('Failed to fetch tee sets');
        }

        // Find the specific tee set for this round
        const teeSet = teeResponse.data.tees.find(tee => tee.id === roundResponse.data.courseTeeId);
        if (!teeSet) {
            throw new Error('Tee set not found');
        }

        // Map the response to RoundWithDetails format
        return {
            ...roundResponse.data,
            tee_set_id: roundResponse.data.courseTeeId,
            date_played: new Date(roundResponse.data.roundDate),
            course: courseResponse.data,
            tee_set: teeSet,
            hole_scores: roundResponse.data.scores?.map(score => ({
                id: score.id,
                round_id: score.roundId,
                hole_number: score.holeNumber,
                strokes: score.strokes,
                putts: score.putts,
                fairway_hit: score.fairwayHit,
                green_in_regulation: score.greenInRegulation,
            })) || [],
        };
    } catch (error) {
        console.error('Error in getRoundWithDetails:', error);
        throw error;
    }
};

/**
 * Gets all rounds for an event
 */
export const getEventRounds = async (eventId: string): Promise<EventRoundSummary> => {
    try {
        console.log(`Getting rounds for event ID: ${eventId}`);
        
        // Get all rounds for the event
        const roundsResponse = await RoundsApiClient.getRounds({
            eventId,
            includeScores: true,
        });

        if (!roundsResponse.success) {
            throw new Error(roundsResponse.error?.message || 'Failed to fetch rounds');
        }

        console.log(`Found ${roundsResponse.data?.rounds.length || 0} rounds for event`);
        
        if (!roundsResponse.data?.rounds.length) {
            return {
                event_id: eventId,
                rounds: []
            };
        }

        // Map the response to EventRoundSummary format
        return {
            event_id: eventId,
            rounds: roundsResponse.data.rounds.map(round => ({
                user_id: round.userId,
                user_name: round.user?.name || '',
                round_id: round.id,
                total_score: round.grossScore || 0,
                total_putts: round.scores?.reduce((sum, score) => sum + (score.putts || 0), 0) || 0,
                fairways_hit: round.scores?.filter(score => score.fairwayHit).length || 0,
                greens_in_regulation: round.scores?.filter(score => score.greenInRegulation).length || 0,
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
        const response = await RoundsApiClient.createScore(input.round_id, {
            holeNumber: input.hole_number,
            strokes: input.strokes,
            putts: input.putts,
            fairwayHit: input.fairway_hit,
            greenInRegulation: input.green_in_regulation,
        });

        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to create hole score');
        }

        return {
            id: response.data.id,
            round_id: response.data.roundId,
            hole_number: response.data.holeNumber,
            strokes: response.data.strokes,
            putts: response.data.putts,
            fairway_hit: response.data.fairwayHit,
            green_in_regulation: response.data.greenInRegulation,
        };
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
        const { id, round_id, ...updateData } = input;
        const response = await RoundsApiClient.updateScore(round_id, id, {
            strokes: updateData.strokes,
            putts: updateData.putts,
            fairwayHit: updateData.fairway_hit,
            greenInRegulation: updateData.green_in_regulation,
        });

        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to update hole score');
        }

        return {
            id: response.data.id,
            round_id: response.data.roundId,
            hole_number: response.data.holeNumber,
            strokes: response.data.strokes,
            putts: response.data.putts,
            fairway_hit: response.data.fairwayHit,
            green_in_regulation: response.data.greenInRegulation,
        };
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
        // Get event details
        const event = await getEventById(eventId);
        if (!event) throw new Error('Event not found');

        // Get all participants
        const participants = await getEventParticipants(eventId);
        if (!participants.length) throw new Error('No participants found for this event');

        // Create rounds for each participant
        const roundPromises = participants.map(async (participant) => {
            // Only create round if participant is confirmed
            if (participant.status !== 'confirmed') return null;

            // Get the default tee set for the course
            const teeResponse = await CoursesApiClient.getCourseTees(event.course_id);
            if (!teeResponse.success || !teeResponse.data?.tees) {
                throw new Error('Failed to fetch tee sets');
            }
            const defaultTeeSet = teeResponse.data.tees.find(tee => tee.is_default);
            if (!defaultTeeSet) throw new Error('No default tee set found');

            // Create the round
            const response = await RoundsApiClient.createRound({
                eventId,
                courseTeeId: defaultTeeSet.id,
                roundDate: event.event_date.toISOString(),
                status: 'pending',
            });

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to create round');
            }

            return response.data;
        });

        // Wait for all rounds to be created
        await Promise.all(roundPromises);

        // Return the event rounds summary
        return await getEventRounds(eventId);
    } catch (error) {
        console.error('Error in initializeEventRounds:', error);
        throw error;
    }
}; 