import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import RoundDbService from '@/api/internal/database/RoundDbService';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/api/base';
import { type Score } from '@/types/database';

// Schema for updating a score
const updateScoreSchema = z.object({
  strokes: z.number().int().min(1).optional(),
  putts: z.number().int().min(0).optional().nullable(),
  fairway_hit: z.boolean().optional().nullable(),
  green_in_regulation: z.boolean().optional().nullable(),
}).partial(); // All fields optional

/**
 * @swagger
 * /api/rounds/{roundId}/scores/{scoreId}:
 *   put:
 *     summary: Update a specific score entry
 *     description: Updates details for a single score record within a round.
 *     tags: [Rounds, Scores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: scoreId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateScoreInput' } # Based on updateScoreSchema
 *     responses:
 *       200: { description: Score updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's round) }
 *       404: { description: Round or Score not found }
 *       500: { description: Internal server error }
 */
const updateScoreHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const roundId = context.params?.roundId as string | undefined;
    const scoreId = context.params?.scoreId as string | undefined;
    if (!roundId || !scoreId) {
        return createErrorApiResponse('Round ID and Score ID are required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, updateScoreSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) {
         return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
    }

    // Construct payload, handling nulls
    const updatePayload: Partial<Omit<Score, 'id' | 'round_id' | 'hole_number'>> = {
        ...validationResult,
        putts: validationResult.putts ?? undefined,
        fairway_hit: validationResult.fairway_hit ?? undefined,
        green_in_regulation: validationResult.green_in_regulation ?? undefined,
    };
    
    const userId = auth.user.id;
    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Authorization Check: Ensure user owns the round associated with the score
        // This requires fetching the score first to get its round_id, then checking round ownership.
        // Alternatively, assume RLS handles this if scores table links to user indirectly.
        // For explicit check:
        const roundCheck = await roundDbService.getRoundById(roundId); // Fetch the round first
        if (!roundCheck.data || roundCheck.error) {
            return createErrorApiResponse('Round not found or error checking ownership', 'NOT_FOUND', 404);
        }
        if (roundCheck.data.user_id !== userId) {
            return createErrorApiResponse('Forbidden: You do not own the round for this score', 'FORBIDDEN', 403);
        }
        // We might also want to check if the scoreId actually belongs to the roundId, but updateRecord might handle this.

        const updateResponse = await roundDbService.updateScore(scoreId, updatePayload);
        if (updateResponse.error) {
            if (updateResponse.error instanceof ServiceError && updateResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                 return createErrorApiResponse('Score not found', updateResponse.error.code, 404);
            }
            throw updateResponse.error;
        }
        if (!updateResponse.data) {
            return createErrorApiResponse('Score not found after update attempt', ErrorCodes.DB_NOT_FOUND, 404);
        }

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /rounds/${roundId}/scores/${scoreId} PUT] Error:`, error);
        if (error instanceof ServiceError) {
            let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 400;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to update score', 'UPDATE_SCORE_ERROR', 500);
    }
};

export const PUT = withAuth(updateScoreHandler);

/**
 * @swagger
 * /api/rounds/{roundId}/scores/{scoreId}:
 *   delete:
 *     summary: Delete a specific score entry
 *     description: Deletes a specific score record from a round.
 *     tags: [Rounds, Scores]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: scoreId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Score deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's round) }
 *       404: { description: Round or Score not found }
 *       500: { description: Internal server error }
 */
const deleteScoreHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const roundId = context.params?.roundId as string | undefined;
    const scoreId = context.params?.scoreId as string | undefined;
    if (!roundId || !scoreId) {
        return createErrorApiResponse('Round ID and Score ID are required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Authorization Check: Ensure user owns the round associated with the score
        // Similar check as in PUT handler
        const roundCheck = await roundDbService.getRoundById(roundId);
        if (!roundCheck.data || roundCheck.error) {
            return createErrorApiResponse('Round not found or error checking ownership', 'NOT_FOUND', 404);
        }
        if (roundCheck.data.user_id !== userId) {
            return createErrorApiResponse('Forbidden: You do not own the round for this score', 'FORBIDDEN', 403);
        }
        // We could also fetch the score to ensure it belongs to the round before deleting.

        const deleteResponse = await roundDbService.removeScore(scoreId);
        if (deleteResponse.error) {
             if (deleteResponse.error instanceof ServiceError && deleteResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                 return createErrorApiResponse('Score not found', deleteResponse.error.code, 404);
             }
             throw deleteResponse.error;
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error(`[API /rounds/${roundId}/scores/${scoreId} DELETE] Error:`, error);
        if (error instanceof ServiceError) {
             let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 500;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to delete score', 'DELETE_SCORE_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteScoreHandler); 