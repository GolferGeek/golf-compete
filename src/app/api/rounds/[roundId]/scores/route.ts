import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import RoundDbService from '@/services/internal/RoundDbService';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';
import { type Score } from '@/types/database';

// Schema for creating a score
const createScoreSchema = z.object({
  // round_id comes from URL
  hole_number: z.number().int().min(1).max(18), 
  strokes: z.number().int().min(1),
  putts: z.number().int().min(0).optional().nullable(),
  fairway_hit: z.boolean().optional().nullable(),
  green_in_regulation: z.boolean().optional().nullable(),
});

/**
 * @swagger
 * /api/rounds/{roundId}/scores:
 *   get:
 *     summary: List scores for a specific round
 *     description: Retrieves all scores associated with a given round ID.
 *     tags: [Rounds, Scores]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of scores for the round }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { roundId: string } }) {
    const { roundId } = params;
    if (!roundId) {
        return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Use getRoundWithScores and extract scores
        const response = await roundDbService.getRoundWithScores(roundId);

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Round not found', response.error.code, 404);
            }
            throw response.error;
        }
        if (!response.data) {
             return createErrorApiResponse('Round not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        
        // Return just the scores array (already sorted by hole_number in service)
        return createSuccessApiResponse(response.data.scores || []);

    } catch (error: any) {
        console.error(`[API /rounds/${roundId}/scores GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch round scores', 'FETCH_SCORES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/rounds/{roundId}/scores:
 *   post:
 *     summary: Add a score to a round
 *     description: Adds a new score entry for a specific hole to a given round.
 *     tags: [Rounds, Scores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateScoreInput' } # Based on createScoreSchema
 *     responses:
 *       201: { description: Score added successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's round) }
 *       404: { description: Round not found }
 *       409: { description: Conflict (score for this hole already exists) }
 *       500: { description: Internal server error }
 */
const addScoreHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const roundId = context.params?.roundId as string | undefined;
    if (!roundId) {
        return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, createScoreSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    // Construct payload, handling nulls and adding round_id
    const scorePayload: Omit<Score, 'id'> = {
        ...validationResult,
        round_id: roundId,
        putts: validationResult.putts ?? undefined,
        fairway_hit: validationResult.fairway_hit ?? undefined,
        green_in_regulation: validationResult.green_in_regulation ?? undefined,
    };
    
    const userId = auth.user.id;
    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Authorization Check: Ensure user owns the round
        const checkResponse = await roundDbService.getRoundById(roundId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Round not found or error checking ownership', 'NOT_FOUND', 404);
        }
        if (checkResponse.data.user_id !== userId) { 
             return createErrorApiResponse('Forbidden: You do not own this round', 'FORBIDDEN', 403);
        }
        
        // TODO: Check if score for this hole already exists? Requires extra query.

        // Add the score
        const addResponse = await roundDbService.addScore(scorePayload);
        if (addResponse.error || !addResponse.data) {
            // Handle potential unique constraint violation (score for hole exists)
             if (addResponse.error instanceof ServiceError && addResponse.error.code === ErrorCodes.DB_CONSTRAINT_VIOLATION) {
                 return createErrorApiResponse('Score for this hole already exists.', addResponse.error.code, 409); // Conflict
             }
            throw addResponse.error || new Error('Failed to add score, no data returned');
        }
        return createSuccessApiResponse(addResponse.data, 201);

    } catch (error: any) {
        console.error(`[API /rounds/${roundId}/scores POST] Error:`, error);
        if (error instanceof ServiceError) {
            // Handle specific DB errors if needed
            return createErrorApiResponse(error.message, error.code, 400); 
        }
        return createErrorApiResponse('Failed to add score', 'ADD_SCORE_ERROR', 500);
    }
};

export const POST = withAuth(addScoreHandler); 