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
import { type Round } from '@/types/database';

// Schema for updating a round
const updateRoundSchema = z.object({
  // user_id, event_id, course_tee_id usually shouldn't change
  round_date: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'dnf']).optional(),
  handicap_index_used: z.number().optional().nullable(),
  course_handicap: z.number().int().optional().nullable(),
  net_score: z.number().int().optional().nullable(),
  gross_score: z.number().int().optional().nullable(),
}).partial();

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   get:
 *     summary: Get a specific round by ID
 *     description: Retrieves details for a single round, potentially including scores.
 *     tags: [Rounds]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: include_scores
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Round details }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { roundId: string } }) {
    const { roundId } = params;
    const { searchParams } = new URL(request.url);
    const includeScores = searchParams.get('include_scores') === 'true';

    if (!roundId) {
        return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        let response;
        if (includeScores) {
            response = await roundDbService.getRoundWithScores(roundId);
        } else {
            response = await roundDbService.getRoundById(roundId);
        }

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Round not found', response.error.code, 404);
            }
            throw response.error;
        }
        if (!response.data) {
             return createErrorApiResponse('Round not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        return createSuccessApiResponse(response.data);
    } catch (error: any) {
        console.error(`[API /rounds/${roundId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch round', 'FETCH_ROUND_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   put:
 *     summary: Update a round
 *     description: Updates details for a specific round (e.g., status, scores).
 *     tags: [Rounds]
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
 *           schema: { $ref: '#/components/schemas/UpdateRoundInput' } # Based on updateRoundSchema
 *     responses:
 *       200: { description: Round updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (user cannot update this round) }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
const updateRoundHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const roundId = context.params?.roundId as string | undefined;
    if (!roundId) {
        return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, updateRoundSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) {
         return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
    }

    // Construct payload, handling nulls
    const updatePayload: Partial<Omit<Round, 'id' | 'event_id' | 'user_id' | 'created_at' | 'updated_at' | 'course_tee_id'> > = {
        ...validationResult,
        handicap_index_used: validationResult.handicap_index_used ?? undefined,
        course_handicap: validationResult.course_handicap ?? undefined,
        net_score: validationResult.net_score ?? undefined,
        gross_score: validationResult.gross_score ?? undefined,
    };
    
    const userId = auth.user.id;
    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Authorization Check: Only allow user who owns the round?
        const checkResponse = await roundDbService.getRoundById(roundId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Round not found or error checking ownership', 'NOT_FOUND', 404);
        }
        if (checkResponse.data.user_id !== userId) { 
             return createErrorApiResponse('Forbidden: You do not own this round', 'FORBIDDEN', 403);
        }

        const updateResponse = await roundDbService.updateRound(roundId, updatePayload);
        if (updateResponse.error) throw updateResponse.error;

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /rounds/${roundId} PUT] Error:`, error);
        if (error instanceof ServiceError) {
            let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 400;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to update round', 'UPDATE_ROUND_ERROR', 500);
    }
};

export const PUT = withAuth(updateRoundHandler);

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   delete:
 *     summary: Delete a round
 *     description: Deletes a specific round and its associated scores. Requires ownership.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Round deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
const deleteRoundHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const roundId = context.params?.roundId as string | undefined;
    if (!roundId) {
        return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }
    const userId = auth.user.id;
    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // Authorization Check
        const checkResponse = await roundDbService.getRoundById(roundId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Round not found or error checking ownership', 'NOT_FOUND', 404);
        }
        if (checkResponse.data.user_id !== userId) { 
             return createErrorApiResponse('Forbidden: You do not own this round', 'FORBIDDEN', 403);
        }

        // Perform delete (service method handles deleting scores first)
        const deleteResponse = await roundDbService.deleteRound(roundId);
        if (deleteResponse.error) throw deleteResponse.error;

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error(`[API /rounds/${roundId} DELETE] Error:`, error);
        if (error instanceof ServiceError) {
             let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 500;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to delete round', 'DELETE_ROUND_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteRoundHandler); 