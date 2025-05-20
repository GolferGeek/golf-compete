import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import SeriesDbService from '@/api/internal/database/SeriesDbService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/api/base';
import AuthService from '@/api/internal/auth/AuthService';

/**
 * @swagger
 * /api/series/{seriesId}/access:
 *   get:
 *     summary: Check user's access to a series
 *     description: Checks if the authenticated user has access to view and manage the series
 *     tags: [Series]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Access check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAccess: { type: boolean }
 *                 role: { type: string, enum: [admin, member, none] }
 *       401: { description: Unauthorized }
 *       404: { description: Series not found }
 *       500: { description: Internal server error }
 */
const checkSeriesAccessHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
) => {
    const seriesId = context.params?.seriesId as string | undefined;
    if (!seriesId) {
        return createErrorApiResponse('Series ID is required in URL path', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);
    const authService = new AuthService(supabase);

    try {
        // Check if user is a global admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data === true) {
            return createSuccessApiResponse({ hasAccess: true, role: 'admin' });
        }

        // Check if series exists and user is the creator
        const seriesResponse = await seriesDbService.getSeriesById(seriesId);
        if (seriesResponse.error) {
            if (seriesResponse.error instanceof ServiceError && seriesResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Series not found', seriesResponse.error.code, 404);
            }
            throw seriesResponse.error;
        }

        if (seriesResponse.data?.created_by === userId) {
            return createSuccessApiResponse({ hasAccess: true, role: 'admin' });
        }

        // Check user's participant role in the series
        const roleResponse = await seriesDbService.getUserSeriesRole(userId, seriesId);
        if (roleResponse.error) {
            if (roleResponse.error instanceof ServiceError && roleResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createSuccessApiResponse({ hasAccess: false, role: 'none' });
            }
            throw roleResponse.error;
        }

        const participantData = roleResponse.data;
        const hasAccess = participantData?.role === 'admin' && participantData?.status === 'active';
        
        return createSuccessApiResponse({
            hasAccess,
            role: participantData?.role || 'none'
        });

    } catch (error: any) {
        console.error(`[API /series/${seriesId}/access GET] Error:`, error);
        return createErrorApiResponse('Failed to check series access', 'CHECK_ACCESS_ERROR', 500);
    }
};

export const GET = withAuth(checkSeriesAccessHandler); 