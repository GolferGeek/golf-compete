import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import SeriesDbService from '@/api/internal/database/SeriesDbService';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/api/base';
import { type SeriesParticipant } from '@/types/database';

// Schema for adding a participant
const addParticipantSchema = z.object({
  user_id: z.string().uuid(),
  // series_id comes from URL
  role: z.enum(['admin', 'participant']).default('participant'),
  status: z.enum(['invited', 'confirmed', 'withdrawn']).default('invited'), // Default to invited?
});

/**
 * @swagger
 * /api/series/{seriesId}/participants:
 *   get:
 *     summary: List participants for a specific series
 *     description: Retrieves all participants associated with a given series ID.
 *     tags: [Series, Participants]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of participants }
 *       404: { description: Series not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { seriesId: string } }) {
    const { seriesId } = params;
    if (!seriesId) {
        return createErrorApiResponse('Series ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        const response = await seriesDbService.getSeriesWithParticipants(seriesId);

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Series not found', response.error.code, 404);
            }
            throw response.error;
        }
        if (!response.data) {
             return createErrorApiResponse('Series not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        
        return createSuccessApiResponse(response.data.participants || []);

    } catch (error: any) {
        console.error(`[API /series/${seriesId}/participants GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch series participants', 'FETCH_PARTICIPANTS_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/series/{seriesId}/participants:
 *   post:
 *     summary: Add a participant to a series
 *     description: Adds or invites a user to a specific series.
 *     tags: [Series, Participants]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddSeriesParticipantInput' } # Based on addParticipantSchema
 *     responses:
 *       201: { description: Participant added successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not series admin) }
 *       404: { description: Series not found }
 *       409: { description: Conflict (user already participant) }
 *       500: { description: Internal server error }
 */
const addParticipantHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const seriesId = context.params?.seriesId as string | undefined;
    if (!seriesId) {
        return createErrorApiResponse('Series ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, addParticipantSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    const participantInputData = validationResult;
    const currentUserId = auth.user.id;
    
    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // Authorization: Only series admin can add participants
        const roleResponse = await seriesDbService.getUserSeriesRole(currentUserId, seriesId);
        if (roleResponse.data?.role !== 'admin') {
             return createErrorApiResponse('Forbidden: You must be an admin to add participants', 'FORBIDDEN', 403);
        }
        
        // TODO: Check if user is already a participant?

        // Add participant
        const addResponse = await seriesDbService.addSeriesParticipant({
            ...participantInputData,
            series_id: seriesId,
        });

        if (addResponse.error || !addResponse.data) {
            if (addResponse.error instanceof ServiceError && addResponse.error.code === ErrorCodes.DB_CONSTRAINT_VIOLATION) {
                 return createErrorApiResponse('User might already be a participant in this series.', addResponse.error.code, 409); // Conflict
             }
            throw addResponse.error || new Error('Failed to add participant, no data returned');
        }
        return createSuccessApiResponse(addResponse.data, 201);

    } catch (error: any) {
        console.error(`[API /series/${seriesId}/participants POST] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to add participant', 'ADD_PARTICIPANT_ERROR', 500);
    }
};

export const POST = withAuth(addParticipantHandler); 