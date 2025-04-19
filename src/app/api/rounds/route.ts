import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import RoundDbService from '@/api/internal/database/RoundDbService';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/api/base';
import { type Round } from '@/types/database';

// Schema for creating a round
const createRoundSchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid(), // Or get from auth context?
  course_tee_id: z.string().uuid(),
  round_date: z.string().datetime(),
  status: z.enum(['pending', 'in_progress', 'completed', 'dnf']).default('pending'),
  handicap_index_used: z.number().optional().nullable(),
  course_handicap: z.number().int().optional().nullable(),
  // Scores are added separately
});

// Schema for query parameters when fetching rounds
const fetchRoundsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('round_date'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateAfter: z.string().datetime({ message: 'Invalid date format for dateAfter' }).optional(),
  dateBefore: z.string().datetime({ message: 'Invalid date format for dateBefore' }).optional(),
});

/**
 * @swagger
 * /api/rounds:
 *   get:
 *     summary: List rounds
 *     description: Retrieves a paginated list of rounds, optionally filtered.
 *     tags: [Rounds]
 *     parameters: # Add query params like userId, eventId, status etc.
 *       # ... (schema based on fetchRoundsQuerySchema)
 *     responses:
 *       200: { description: List of rounds }
 *       400: { description: Invalid query parameters }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest) {
    const queryValidation = await validateQueryParams(request, fetchRoundsQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { 
        limit, 
        page, 
        sortBy, 
        sortDir, 
        userId, 
        eventId, 
        status, 
        dateAfter,
        dateBefore
    } = queryValidation;
    const offset = (page - 1) * limit;

    // Construct filters
    const filters: Record<string, any> = {};
    if (userId) filters.user_id = userId;
    if (eventId) filters.event_id = eventId;
    if (status) filters.status = status;
    if (dateAfter) {
        filters.round_date = { ...(filters.round_date || {}), gte: dateAfter };
    }
    if (dateBefore) {
        filters.round_date = { ...(filters.round_date || {}), lte: dateBefore };
    }

    const ordering = sortBy ? { column: sortBy, direction: sortDir } : undefined;

    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        const response = await roundDbService.fetchRounds(
            { pagination: { limit, offset, page }, ordering, filters }, 
            { useCamelCase: true }
        );
        if (response.error) throw response.error;
        return createSuccessApiResponse(response);
    } catch (error: any) {
        console.error('[API /rounds GET] Error:', error);
        return createErrorApiResponse('Failed to fetch rounds', 'FETCH_ROUNDS_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/rounds:
 *   post:
 *     summary: Create a new round
 *     description: Creates a new round record, usually associated with an event participant.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateRoundInput' } # Based on createRoundSchema
 *     responses:
 *       201: { description: Round created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (e.g., user not part of the event) }
 *       500: { description: Internal server error }
 */
const createRoundHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, createRoundSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    // Authorization: Ensure the authenticated user matches the user_id in the payload
    // OR that the user has permission to create a round for someone else (e.g., admin)
    if (validationResult.user_id !== auth.user.id) {
        // TODO: Add admin check or other permission logic if needed
        return createErrorApiResponse('Forbidden: Cannot create round for another user.', 'FORBIDDEN', 403);
    }

    // Construct payload, handling nulls
    const roundPayload: Omit<Round, 'id' | 'created_at' | 'updated_at'> = {
        ...validationResult,
        handicap_index_used: validationResult.handicap_index_used ?? undefined,
        course_handicap: validationResult.course_handicap ?? undefined,
    };

    const supabase = await createClient();
    const roundDbService = new RoundDbService(supabase);

    try {
        // TODO: Add check to ensure user is a participant in the event?
        const createResponse = await roundDbService.createRound(roundPayload);
        if (createResponse.error || !createResponse.data) {
            throw createResponse.error || new Error('Failed to create round, no data returned');
        }
        return createSuccessApiResponse(createResponse.data, 201);
    } catch (error: any) {
        console.error('[API /rounds POST] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to create round', 'CREATE_ROUND_ERROR', 500);
    }
};

export const POST = withAuth(createRoundHandler); 