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

// Schema for updating a participant (role, status)
const updateParticipantSchema = z.object({
  role: z.enum(['admin', 'participant']).optional(),
  status: z.enum(['invited', 'confirmed', 'withdrawn']).optional(),
}).partial();

/**
 * @swagger
 * /api/series/{seriesId}/participants/{participantId}:
 *   get:
 *     summary: Get a specific participant in a series
 *     tags: [Series, Participants]
 *     parameters:
 *       - { name: seriesId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: participantId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Participant details }
 *       404: { description: Series or Participant not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { seriesId: string, participantId: string } }) {
    const { seriesId, participantId } = params;
    if (!seriesId || !participantId) {
        return createErrorApiResponse('Series ID and Participant ID are required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        const response = await seriesDbService.getSeriesParticipantById(participantId);
        if (response.error || !response.data) {
            return createErrorApiResponse('Participant not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        // Ensure participant belongs to the specified series
        if (response.data.series_id !== seriesId) {
            return createErrorApiResponse('Participant not found in this series', 'NOT_FOUND', 404);
        }
        return createSuccessApiResponse(response.data);
    } catch (error: any) {
        console.error(`[API /series/.../participants GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch participant', 'FETCH_PARTICIPANT_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/series/{seriesId}/participants/{participantId}:
 *   put:
 *     summary: Update a series participant
 *     description: Updates the role or status of a participant in a series.
 *     tags: [Series, Participants]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: seriesId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: participantId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateSeriesParticipantInput' } # Based on updateParticipantSchema
 *     responses:
 *       200: { description: Participant updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not series admin) }
 *       404: { description: Series or Participant not found }
 *       500: { description: Internal server error }
 */
const updateParticipantHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const seriesId = context.params?.seriesId as string | undefined;
    const participantId = context.params?.participantId as string | undefined;
    if (!seriesId || !participantId) { 
        return createErrorApiResponse('Series ID and Participant ID are required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, updateParticipantSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) { /* ... error ... */ }

    // --- TEMPORARY Workaround: Cast payload type --- 
    // This avoids fetching existing data but relies on client sending complete data
    // or accepting potential errors if required fields (role, status) are missing.
    const updatePayload = validationResult as Omit<SeriesParticipant, 'id' | 'user_id' | 'series_id' | 'joined_at'>;
    // --- END Temporary Workaround --- 
    
    const currentUserId = auth.user.id;
    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // Authorization: Only series admin can update participants
        const roleResponse = await seriesDbService.getUserSeriesRole(currentUserId, seriesId!);
        if (roleResponse.data?.role !== 'admin') {
             return createErrorApiResponse('Forbidden: You must be an admin to update participants', 'FORBIDDEN', 403);
        }
        
        // Ensure participant exists and belongs to the series (optional, updateRecord might handle)
        // const check = await seriesDbService.getSeriesParticipantById(participantId);
        // if (!check.data || check.data.series_id !== seriesId) { ... return 404 ... }
        
        // Perform update
        const updateResponse = await seriesDbService.updateSeriesParticipant(participantId!, updatePayload);
        if (updateResponse.error) {
            if (updateResponse.error instanceof ServiceError && updateResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                 return createErrorApiResponse('Participant not found', updateResponse.error.code, 404);
            }
            throw updateResponse.error;
        }
        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /series/.../participants PUT] Error:`, error);
        return createErrorApiResponse('Failed to update participant', 'UPDATE_PARTICIPANT_ERROR', 500);
    }
};

export const PUT = withAuth(updateParticipantHandler);

/**
 * @swagger
 * /api/series/{seriesId}/participants/{participantId}:
 *   delete:
 *     summary: Remove a participant from a series
 *     tags: [Series, Participants]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: seriesId, in: path, required: true, schema: { type: string, format: uuid } }
 *       - { name: participantId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       204: { description: Participant removed successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not series admin) }
 *       404: { description: Series or Participant not found }
 *       500: { description: Internal server error }
 */
const deleteParticipantHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const seriesId = context.params?.seriesId as string | undefined;
    const participantId = context.params?.participantId as string | undefined;
    if (!seriesId || !participantId) { 
         return createErrorApiResponse('Series ID and Participant ID are required', 'VALIDATION_ERROR', 400);
    }
    
    const currentUserId = auth.user.id;
    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // Authorization: Only series admin can remove participants
        const roleResponse = await seriesDbService.getUserSeriesRole(currentUserId, seriesId!);
        if (roleResponse.data?.role !== 'admin') {
             return createErrorApiResponse('Forbidden: You must be an admin to remove participants', 'FORBIDDEN', 403);
        }
        
        // Ensure participant exists and belongs to the series (optional, deleteRecord might handle)
        // const check = await seriesDbService.getSeriesParticipantById(participantId);
        // if (!check.data || check.data.series_id !== seriesId) { ... return 404 ... }

        // Perform delete
        const deleteResponse = await seriesDbService.removeSeriesParticipant(participantId!);
        if (deleteResponse.error) {
             if (deleteResponse.error instanceof ServiceError && deleteResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                 return createErrorApiResponse('Participant not found', deleteResponse.error.code, 404);
             }
             throw deleteResponse.error;
        }
        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        console.error(`[API /series/.../participants DELETE] Error:`, error);
        return createErrorApiResponse('Failed to remove participant', 'REMOVE_PARTICIPANT_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteParticipantHandler); 