import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import SeriesDbService from '@/services/internal/SeriesDbService';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/services/base';
import { type Series } from '@/types/database'; // Import type

// Schema for creating a series
const createSeriesSchema = z.object({
  name: z.string().min(3, { message: 'Series name must be at least 3 characters' }),
  description: z.string().optional(),
  start_date: z.string().datetime({ message: 'Invalid start date format' }),
  end_date: z.string().datetime({ message: 'Invalid end date format' }),
  status: z.enum(['draft', 'active', 'completed']).optional().default('draft'),
  // created_by will be set automatically from authenticated user
});

// Schema for query parameters when fetching series
const fetchSeriesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional(), // e.g., 'name', 'start_date'
  sortDir: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z.string().optional(), // Filter by status
  // Add date range filters
  startDateAfter: z.string().datetime({ message: 'Invalid date format for startDateAfter' }).optional(),
  endDateBefore: z.string().datetime({ message: 'Invalid date format for endDateBefore' }).optional(),
  search: z.string().optional(), // Add search parameter
  // Add other filters as needed (e.g., searchByName)
});

/**
 * @swagger
 * /api/series:
 *   get:
 *     summary: List available series
 *     description: Retrieves a paginated list of series, optionally filtered and sorted.
 *     tags: [Series]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, start_date, status] }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, active, completed] }
 *     responses:
 *       200: { description: List of series } # Simplified for brevity
 *       400: { description: Invalid query parameters }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest) {
    const queryValidation = await validateQueryParams(request, fetchSeriesQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { limit, page, sortBy, sortDir, status, startDateAfter, endDateBefore, search } = queryValidation;
    const offset = (page - 1) * limit;

    // Construct standard AND filters
    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (startDateAfter) {
        filters.start_date = { ...(filters.start_date || {}), gte: startDateAfter };
    }
    if (endDateBefore) {
        filters.end_date = { ...(filters.end_date || {}), lte: endDateBefore };
    }
    
    // Construct OR filter string for search
    let orFilterString: string | undefined = undefined;
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`; // Add wildcards
        // Combine multiple fields with OR logic using ilike
        orFilterString = `name.ilike.${searchTerm},description.ilike.${searchTerm}`;
    }

    const ordering = sortBy ? { column: sortBy, direction: sortDir } : undefined;

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // Pass both filters and orFilter to the service method
        const response = await seriesDbService.fetchSeries(
            { pagination: { limit, offset, page }, ordering, filters, orFilter: orFilterString }, 
            { useCamelCase: true }
        );
        if (response.error) throw response.error;
        return createSuccessApiResponse(response);
    } catch (error: any) {
        console.error('[API /series GET] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 500); // Or map specific codes
        }
        return createErrorApiResponse('Failed to fetch series', 'FETCH_SERIES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/series:
 *   post:
 *     summary: Create a new series
 *     description: Creates a new golf series and makes the creator an admin participant.
 *     tags: [Series]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSeriesInput' } # Define this based on createSeriesSchema
 *     responses:
 *       201: { description: Series created successfully } 
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const createSeriesHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, createSeriesSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    const seriesInputData = validationResult;
    const userId = auth.user.id;

    const supabase = await createClient();
    const seriesDbService = new SeriesDbService(supabase);

    try {
        // Call the transactional RPC function
        const createResponse = await seriesDbService.createSeriesAndAddAdmin({
            ...seriesInputData,
            created_by: userId,
        });

        if (createResponse.error || !createResponse.data?.created_series_id) {
            throw createResponse.error || new Error('Failed to create series via RPC, no ID returned');
        }

        const newSeriesId = createResponse.data.created_series_id;

        // Fetch the newly created series data to return it fully
        const newSeriesResponse = await seriesDbService.getSeriesById(newSeriesId);
        
        if (newSeriesResponse.error || !newSeriesResponse.data) {
             // Series was created but couldn't fetch it? Log error but maybe still return success?
             console.error(`Failed to fetch newly created series ${newSeriesId}:`, newSeriesResponse.error);
             return createErrorApiResponse('Series created, but failed to fetch full data.', 'FETCH_AFTER_CREATE_FAILED', 500);
        }

        // Remove the separate addSeriesParticipant call as it's handled by RPC
        /*
        const participantResponse = await seriesDbService.addSeriesParticipant({...});
        if (participantResponse.error) { ... }
        */

        return createSuccessApiResponse(newSeriesResponse.data, 201);

    } catch (error: any) {
        console.error('[API /series POST] Error:', error);
        if (error instanceof ServiceError) {
             // Check for specific RPC error code if defined in BaseService/types
            if (error.code === 'DB_RPC_ERROR') {
                 return createErrorApiResponse(error.message, error.code, 500); // Internal Server Error for RPC failure
            } else {
                 return createErrorApiResponse(error.message, error.code, 400); // Constraint or other DB error
            }
        }
        return createErrorApiResponse('Failed to create series', 'CREATE_SERIES_ERROR', 500);
    }
};

export const POST = withAuth(createSeriesHandler); 