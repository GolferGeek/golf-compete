import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import SeriesDbService from '@/api/internal/database/SeriesDbService';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/api/base';

// Schema for responding to an invitation
const respondSchema = z.object({
    accept: z.boolean()
});

/**
 * @swagger
 * /api/series/participants/{participantId}/respond:
 *   post:
 *     summary: Respond to a series invitation
 *     description: Accept or decline an invitation to join a series
 *     tags: [Series, Participants]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accept: { type: boolean }
 *             required: [accept]
 *     responses:
 *       200: { description: Successfully responded to invitation }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - can only respond to own invitations }
 *       404: { description: Invitation not found }
 *       500: { description: Internal server error }
 */
const respondToInvitationHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
): Promise<Response> => {
    const participantId = context.params?.participantId as string | undefined;
    if (!participantId) {
        return createErrorApiResponse('Participant ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, respondSchema);
    if (validationResult instanceof Response) return validationResult;

    const { accept } = validationResult;
    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // First get the participant record to verify ownership
        const participantResponse = await seriesDbService.getSeriesParticipantById(participantId);
        if (participantResponse.error || !participantResponse.data) {
            return createErrorApiResponse('Invitation not found', ErrorCodes.DB_NOT_FOUND, 404);
        }

        // Verify the user owns this invitation
        if (participantResponse.data.user_id !== auth.user.id) {
            return createErrorApiResponse('You can only respond to your own invitations', 'FORBIDDEN', 403);
        }

        // Verify the invitation is still pending
        if (participantResponse.data.status !== 'invited') {
            return createErrorApiResponse('This invitation has already been responded to', 'INVALID_STATE', 400);
        }

        // Update the participant status
        const updateResponse = await seriesDbService.updateSeriesParticipant(participantId, {
            status: accept ? 'confirmed' : 'declined',
            joined_at: accept ? new Date().toISOString() : null
        });

        if (updateResponse.error) {
            throw updateResponse.error;
        }

        return createSuccessApiResponse(updateResponse.data);
    } catch (error: any) {
        console.error(`[API /series/participants/${participantId}/respond POST] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to respond to invitation', 'RESPOND_INVITATION_ERROR', 500);
    }
};

export const POST = withAuth(respondToInvitationHandler); 