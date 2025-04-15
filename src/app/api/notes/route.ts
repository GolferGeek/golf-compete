import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import NoteDbService from '@/services/internal/NoteDbService';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/services/base';
import { type UserNote } from '@/types/database';

// Schema for creating a note
const createNoteSchema = z.object({
  content: z.string().min(1, { message: 'Note content cannot be empty' }),
  related_resource_id: z.string().uuid().optional().nullable(),
  related_resource_type: z.enum(['series', 'event', 'round', 'course', 'player']).optional().nullable(),
  // user_id is added from auth context
});

// Schema for query parameters when fetching notes
const fetchNotesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(50),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('created_at'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  related_resource_id: z.string().uuid().optional(),
  related_resource_type: z.enum(['series', 'event', 'round', 'course', 'player']).optional(),
  // user_id filter is applied automatically based on auth context
});

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: List user's notes
 *     description: Retrieves a paginated list of notes for the authenticated user, optionally filtered by related resource.
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters: # Add query params
 *       # ... (schema based on fetchNotesQuerySchema)
 *     responses:
 *       200: { description: List of notes }
 *       400: { description: Invalid query parameters }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const getNotesHandler = async (
    request: NextRequest,
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const queryValidation = await validateQueryParams(request, fetchNotesQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { limit, page, sortBy, sortDir, related_resource_id, related_resource_type } = queryValidation;
    const offset = (page - 1) * limit;
    const userId = auth.user.id;

    // Construct filters - ALWAYS filter by user_id for this endpoint
    const filters: Record<string, any> = { user_id: userId };
    if (related_resource_id) filters.related_resource_id = related_resource_id;
    if (related_resource_type) filters.related_resource_type = related_resource_type;

    const ordering = sortBy ? { column: sortBy, direction: sortDir } : undefined;

    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        const response = await noteDbService.fetchNotes(
            { pagination: { limit, offset, page }, ordering, filters }, 
            { useCamelCase: true }
        );
        if (response.error) throw response.error;
        return createSuccessApiResponse(response);
    } catch (error: any) {
        console.error('[API /notes GET] Error:', error);
        return createErrorApiResponse('Failed to fetch notes', 'FETCH_NOTES_ERROR', 500);
    }
};
export const GET = withAuth(getNotesHandler);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     description: Creates a new note for the authenticated user.
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateNoteInput' } # Based on createNoteSchema
 *     responses:
 *       201: { description: Note created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const createNoteHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, createNoteSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    // Construct payload, handling nulls and adding user_id
    const notePayload: Omit<UserNote, 'id' | 'created_at' | 'updated_at'> = {
        ...validationResult,
        user_id: auth.user.id,
        related_resource_id: validationResult.related_resource_id ?? undefined,
        related_resource_type: validationResult.related_resource_type ?? undefined,
    };

    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        const createResponse = await noteDbService.createNote(notePayload);
        if (createResponse.error || !createResponse.data) {
            throw createResponse.error || new Error('Failed to create note, no data returned');
        }
        return createSuccessApiResponse(createResponse.data, 201);
    } catch (error: any) {
        console.error('[API /notes POST] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to create note', 'CREATE_NOTE_ERROR', 500);
    }
};

export const POST = withAuth(createNoteHandler); 