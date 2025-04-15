import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import EventDbService from '@/services/internal/EventDbService';
import SeriesDbService from '@/services/internal/SeriesDbService';
import AuthService from '@/services/internal/AuthService';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';
import { type Event } from '@/types/database'; // Import shared type

// Schema for updating an event
const updateEventSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  event_date: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
  series_id: z.string().uuid().optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
}).partial(); // Makes all fields optional

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get a specific event by ID
 *     description: Retrieves details for a single event, potentially including participants.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: include_participants
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Event details }
 *       404: { description: Event not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
    const { eventId } = params;
    const { searchParams } = new URL(request.url);
    const includeParticipants = searchParams.get('include_participants') === 'true';

    if (!eventId) {
        return createErrorApiResponse('Event ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const eventDbService = new EventDbService(supabase);

    try {
        let response;
        if (includeParticipants) {
            response = await eventDbService.getEventWithParticipants(eventId);
        } else {
            response = await eventDbService.getEventById(eventId);
        }

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Event not found', response.error.code, 404);
            }
            throw response.error;
        }
        
        if (!response.data) {
             return createErrorApiResponse('Event not found', ErrorCodes.DB_NOT_FOUND, 404);
        }

        return createSuccessApiResponse(response.data);

    } catch (error: any) {
        console.error(`[API /events/${eventId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch event', 'FETCH_EVENT_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update an event
 *     description: Updates details for a specific event.
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateEventInput' } # Based on updateEventSchema
 *     responses:
 *       200: { description: Event updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (user cannot update this event) }
 *       404: { description: Event not found }
 *       500: { description: Internal server error }
 */
const updateEventHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const eventId = context.params?.eventId as string | undefined;
    if (!eventId) {
        return createErrorApiResponse('Event ID is required', 'VALIDATION_ERROR', 400);
    }
    const userId = auth.user.id;

    // --- Authorization Check --- 
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    const eventDbService = new EventDbService(supabase);
    const seriesDbService = new SeriesDbService(supabase);
    let isAuthorized = false;

    try {
        // 1. Check if Site Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data === true) {
            isAuthorized = true;
        }

        // 2. If not site admin, check Event Creator or Series Admin
        if (!isAuthorized) {
            const eventResponse = await eventDbService.getEventById(eventId);
            if (eventResponse.error || !eventResponse.data) {
                return createErrorApiResponse('Event not found or error checking ownership', 'NOT_FOUND', 404);
            }
            const eventData = eventResponse.data;

            if (eventData.created_by === userId) {
                isAuthorized = true;
            } else if (eventData.series_id) {
                const roleResponse = await seriesDbService.getUserSeriesRole(userId, eventData.series_id);
                if (roleResponse.data?.role === 'admin') {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return createErrorApiResponse('Forbidden: You do not have permission to update this event', 'FORBIDDEN', 403);
        }
        // --- End Authorization Check ---

        // Perform update ...
        const validationResult = await validateRequestBody(request, updateEventSchema);
        if (validationResult instanceof NextResponse) return validationResult;
        
        if (Object.keys(validationResult).length === 0) {
             return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
        }

        // Construct payload, handling nulls
        const updatePayload: Partial<Omit<Event, 'id' | 'created_by' | 'created_at' | 'updated_at'>> = {
            ...validationResult,
            description: validationResult.description === null ? undefined : validationResult.description,
            series_id: validationResult.series_id === null ? undefined : validationResult.series_id,
            course_id: validationResult.course_id === null ? undefined : validationResult.course_id,
        };
        
        const updateResponse = await eventDbService.updateEvent(eventId, updatePayload);
        if (updateResponse.error) throw updateResponse.error;

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /events/${eventId} PUT] Error:`, error);
        if (error instanceof ServiceError) {
            let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 400;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to update event', 'UPDATE_EVENT_ERROR', 500);
    }
};

export const PUT = withAuth(updateEventHandler);

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     description: Deletes a specific event. Requires ownership/admin rights.
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Event deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Event not found }
 *       500: { description: Internal server error }
 */
const deleteEventHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const eventId = context.params?.eventId as string | undefined;
    if (!eventId) {
        return createErrorApiResponse('Event ID is required', 'VALIDATION_ERROR', 400);
    }
    const userId = auth.user.id;

    // --- Authorization Check --- 
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    const eventDbService = new EventDbService(supabase);
    const seriesDbService = new SeriesDbService(supabase);
    let isAuthorized = false;

    try {
        // 1. Check if Site Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data === true) {
            isAuthorized = true;
        }

        // 2. If not site admin, check Event Creator or Series Admin
        if (!isAuthorized) {
            const eventResponse = await eventDbService.getEventById(eventId);
            if (eventResponse.error || !eventResponse.data) {
                return createErrorApiResponse('Event not found or error checking ownership', 'NOT_FOUND', 404);
            }
            const eventData = eventResponse.data;

            if (eventData.created_by === userId) {
                isAuthorized = true;
            } else if (eventData.series_id) {
                const roleResponse = await seriesDbService.getUserSeriesRole(userId, eventData.series_id);
                if (roleResponse.data?.role === 'admin') {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return createErrorApiResponse('Forbidden: You do not have permission to delete this event', 'FORBIDDEN', 403);
        }
        // --- End Authorization Check ---

        // Perform delete ...
        const deleteResponse = await eventDbService.deleteEvent(eventId);
        if (deleteResponse.error) throw deleteResponse.error;

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error(`[API /events/${eventId} DELETE] Error:`, error);
        if (error instanceof ServiceError) {
             let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 500;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to delete event', 'DELETE_EVENT_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteEventHandler); 