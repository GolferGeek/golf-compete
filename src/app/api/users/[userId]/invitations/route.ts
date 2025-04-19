import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import SeriesDbService from '@/api/internal/database/SeriesDbService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/api/base';

/**
 * @swagger
 * /api/users/{userId}/invitations:
 *   get:
 *     summary: Get all series invitations for a user
 *     description: Retrieves all pending series invitations for the specified user
 *     tags: [Users, Series]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of pending invitations }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - can only view own invitations }
 *       500: { description: Internal server error }
 */
const getInvitationsHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
): Promise<Response> => {
    const userId = context.params?.userId as string | undefined;
    if (!userId) {
        return createErrorApiResponse('User ID is required', 'VALIDATION_ERROR', 400);
    }

    // Users can only view their own invitations
    if (auth.user.id !== userId) {
        return createErrorApiResponse('You can only view your own invitations', 'FORBIDDEN', 403);
    }

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        const response = await seriesDbService.getUserInvitations(userId);
        if (response.error) {
            throw response.error;
        }

        return createSuccessApiResponse(response.data || []);
    } catch (error: any) {
        console.error(`[API /users/${userId}/invitations GET] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to fetch invitations', 'FETCH_INVITATIONS_ERROR', 500);
    }
};

export const GET = withAuth(getInvitationsHandler); 