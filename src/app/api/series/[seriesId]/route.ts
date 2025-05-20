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
import { type Series } from '@/types/database';
import AuthService from '@/api/internal/auth/AuthService';

// Schema for updating a series (similar to create but all optional)
const updateSeriesSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'completed']).optional(),
}).partial(); // Makes all fields optional

/**
 * @swagger
 * /api/series/{seriesId}:
 *   get:
 *     summary: Get a specific series by ID
 *     description: Retrieves details for a single series, potentially including participants.
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: include_participants
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Series details }
 *       404: { description: Series not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { seriesId: string } }) {
    const { seriesId } = params;
    const { searchParams } = new URL(request.url);
    const includeParticipants = searchParams.get('include_participants') === 'true';

    if (!seriesId) {
        return createErrorApiResponse('Series ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        let response;
        if (includeParticipants) {
            response = await seriesDbService.getSeriesWithParticipants(seriesId);
        } else {
            response = await seriesDbService.getSeriesById(seriesId);
        }

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Series not found', response.error.code, 404);
            }
            throw response.error;
        }
        
        if (!response.data) {
             return createErrorApiResponse('Series not found', ErrorCodes.DB_NOT_FOUND, 404);
        }

        return createSuccessApiResponse(response.data);

    } catch (error: any) {
        console.error(`[API /series/${seriesId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch series', 'FETCH_SERIES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/series/{seriesId}:
 *   put:
 *     summary: Update a series
 *     description: Updates details for a specific series.
 *     tags: [Series]
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
 *           schema: { $ref: '#/components/schemas/UpdateSeriesInput' } # Based on updateSeriesSchema
 *     responses:
 *       200: { description: Series updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (user cannot update this series) }
 *       404: { description: Series not found }
 *       500: { description: Internal server error }
 */
// Note: PUT implies replacing the entire resource, PATCH is for partial updates.
// Using PUT here, but allowing partial updates via schema. A PATCH might be semantically better.
const updateSeriesHandler = async (
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
        // Authorization Check: User must be Site Admin OR Series Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        const isSiteAdmin = isAdminResponse.data === true;

        let isSeriesAdmin = false;
        if (!isSiteAdmin) {
            const roleResponse = await seriesDbService.getUserSeriesRole(userId, seriesId);
            if (roleResponse.error) {
                console.error(`Error checking series role for user ${userId} on series ${seriesId}:`, roleResponse.error);
            } else {
                isSeriesAdmin = roleResponse.data?.role === 'admin';
            }
        }

        if (!isSiteAdmin && !isSeriesAdmin) {
             return createErrorApiResponse('Forbidden: You must be a site admin or series admin to update this series', 'FORBIDDEN', 403);
        }

        // Perform the update with the correctly typed payload
        const validationResult = await validateRequestBody(request, updateSeriesSchema);
        if (validationResult instanceof NextResponse) return validationResult;
        
        if (Object.keys(validationResult).length === 0) {
             return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
        }

        // Construct the payload with the correct type, handling null description
        const updatePayload: Partial<Omit<Series, 'id' | 'created_by' | 'created_at' | 'updated_at'>> = {
            ...validationResult,
            description: validationResult.description === null ? undefined : validationResult.description,
        };
        
        // Perform the update
        const updateResponse = await seriesDbService.updateSeries(seriesId, updatePayload);
        if (updateResponse.error) throw updateResponse.error;

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /series/${seriesId} PUT] Error:`, error);
        if (error instanceof ServiceError) {
            let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 400;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to update series', 'UPDATE_SERIES_ERROR', 500);
    }
};

export const PUT = withAuth(updateSeriesHandler);

/**
 * @swagger
 * /api/series/{seriesId}:
 *   delete:
 *     summary: Delete a series
 *     description: Deletes a specific series. Requires ownership/admin rights.
 *     tags: [Series]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Series deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Series not found }
 *       500: { description: Internal server error }
 */
const deleteSeriesHandler = async (
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
        // Authorization Check: User must be Site Admin OR Series Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        const isSiteAdmin = isAdminResponse.data === true;

        let isSeriesAdmin = false;
        if (!isSiteAdmin) {
            const roleResponse = await seriesDbService.getUserSeriesRole(userId, seriesId);
            if (roleResponse.error) {
                console.error(`Error checking series role for user ${userId} on series ${seriesId}:`, roleResponse.error);
            } else {
                isSeriesAdmin = roleResponse.data?.role === 'admin';
            }
        }

        if (!isSiteAdmin && !isSeriesAdmin) {
             return createErrorApiResponse('Forbidden: You must be a site admin or series admin to delete this series', 'FORBIDDEN', 403);
        }

        // Perform delete
        const deleteResponse = await seriesDbService.deleteSeries(seriesId);
        if (deleteResponse.error) throw deleteResponse.error;

        return new NextResponse(null, { status: 204 }); // No Content success response

    } catch (error: any) {
        console.error(`[API /series/${seriesId} DELETE] Error:`, error);
        if (error instanceof ServiceError) {
             let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 500;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to delete series', 'DELETE_SERIES_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteSeriesHandler); 