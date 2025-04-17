import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import EventDbService from '@/services/internal/EventDbService';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/services/base';
import { type Event } from '@/types/database'; // Import shared type

// Schema for creating an event
const createEventSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters' }),
  description: z.string().optional(),
  event_date: z.string().datetime({ message: 'Invalid event date format' }),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional().default('scheduled'),
  series_id: z.string().uuid().optional().nullable(), // Optional link to series
  course_id: z.string().uuid().optional().nullable(), // Optional link to course
  // format: z.string().optional(), // Removed
  // created_by will be set automatically from authenticated user
});

// Schema for query parameters when fetching events
const fetchEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('event_date'), // Default sort by date
  sortDir: z.enum(['asc', 'desc']).optional().default('asc'), // Default asc for dates
  status: z.string().optional(),
  seriesId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  // Add date range and search
  startDateAfter: z.string().datetime({ message: 'Invalid date format for startDateAfter' }).optional(),
  endDateBefore: z.string().datetime({ message: 'Invalid date format for endDateBefore' }).optional(),
  search: z.string().optional(),
});

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: List available events
 *     description: Retrieves a paginated list of events, optionally filtered and sorted.
 *     tags: [Events]
 *     parameters: # Add query params like seriesId, courseId, status etc.
 *       # ... (schema based on fetchEventsQuerySchema)
 *     responses:
 *       200: { description: List of events }
 *       400: { description: Invalid query parameters }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest) {
    const queryValidation = await validateQueryParams(request, fetchEventsQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { 
        limit, 
        page, 
        sortBy, 
        sortDir, 
        status, 
        seriesId, 
        courseId, 
        startDateAfter, 
        endDateBefore, 
        search 
    } = queryValidation;
    const offset = (page - 1) * limit;

    // Construct filters
    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (seriesId) filters.series_id = seriesId;
    if (courseId) filters.course_id = courseId;
    if (startDateAfter) {
        filters.event_date = { ...(filters.event_date || {}), gte: startDateAfter };
    }
    if (endDateBefore) {
        filters.event_date = { ...(filters.event_date || {}), lte: endDateBefore };
    }

    // Construct OR filter for search
    let orFilterString: string | undefined = undefined;
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        orFilterString = `name.ilike.${searchTerm},description.ilike.${searchTerm}`;
    }

    const ordering = sortBy ? { column: sortBy, direction: sortDir } : undefined;

    const supabase = await createClient();
    const eventDbService = new EventDbService(supabase);

    try {
        const response = await eventDbService.fetchEvents(
            { pagination: { limit, offset, page }, ordering, filters, orFilter: orFilterString }, 
            { useCamelCase: true }
        );
        if (response.error) throw response.error;
        return createSuccessApiResponse(response);
    } catch (error: any) {
        console.error('[API /events GET] Error:', error);
        return createErrorApiResponse('Failed to fetch events', 'FETCH_EVENTS_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Creates a new golf event.
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateEventInput' } # Based on createEventSchema
 *     responses:
 *       201: { description: Event created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const createEventHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, createEventSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    const eventInputData = validationResult;
    const userId = auth.user.id;
    
    // Construct the payload with correct types, handling nulls
    const eventPayload: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
        ...eventInputData,
        series_id: eventInputData.series_id === null ? undefined : eventInputData.series_id,
        course_id: eventInputData.course_id === null ? undefined : eventInputData.course_id,
        created_by: userId, // Set creator
    };

    const supabase = await createClient();
    const eventDbService = new EventDbService(supabase);

    try {
        // Create the event using the correctly typed payload
        const createResponse = await eventDbService.createEvent(eventPayload);

        if (createResponse.error || !createResponse.data) {
            throw createResponse.error || new Error('Failed to create event, no data returned');
        }

        const newEvent = createResponse.data;

        // Optionally auto-add creator as participant? Depends on requirements.
        // const participantResponse = await eventDbService.addEventParticipant({...});

        return createSuccessApiResponse(newEvent, 201);

    } catch (error: any) {
        console.error('[API /events POST] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to create event', 'CREATE_EVENT_ERROR', 500);
    }
};

export const POST = withAuth(createEventHandler); 