import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import NoteDbService from '@/services/internal/NoteDbService';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';
import { type UserNote } from '@/types/database';

// Schema for updating a note
const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  related_resource_id: z.string().uuid().optional().nullable(),
  related_resource_type: z.enum(['series', 'event', 'round', 'course', 'player']).optional().nullable(),
}).partial();

/**
 * @swagger
 * /api/notes/{noteId}:
 *   get:
 *     summary: Get a specific note by ID
 *     description: Retrieves details for a single note, ensuring user owns it.
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: noteId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Note details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's note) }
 *       404: { description: Note not found }
 *       500: { description: Internal server error }
 */
const getNoteHandler = async (request: NextRequest, context: { params?: any }, auth: AuthenticatedContext) => {
    const noteId = context.params?.noteId as string | undefined;
    if (!noteId) return createErrorApiResponse('Note ID is required', 'VALIDATION_ERROR', 400);
    
    const userId = auth.user.id;
    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        const response = await noteDbService.getNoteById(noteId);
        if (response.error || !response.data) {
            return createErrorApiResponse('Note not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        // Authorization: Ensure the fetched note belongs to the authenticated user
        if (response.data.user_id !== userId) {
             return createErrorApiResponse('Forbidden: Cannot access this note', 'FORBIDDEN', 403);
        }
        return createSuccessApiResponse(response.data);
    } catch (error: any) {
        console.error(`[API /notes/${noteId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch note', 'FETCH_NOTE_ERROR', 500);
    }
};
export const GET = withAuth(getNoteHandler);

/**
 * @swagger
 * /api/notes/{noteId}:
 *   put:
 *     summary: Update a specific note
 *     description: Updates the content or association of a specific note owned by the user.
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: noteId, in: path, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateNoteInput' } # Based on updateNoteSchema
 *     responses:
 *       200: { description: Note updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's note) }
 *       404: { description: Note not found }
 *       500: { description: Internal server error }
 */
const updateNoteHandler = async (request: NextRequest, context: { params?: any }, auth: AuthenticatedContext) => {
    const noteId = context.params?.noteId as string | undefined;
    if (!noteId) return createErrorApiResponse('Note ID is required', 'VALIDATION_ERROR', 400);
    
    const validationResult = await validateRequestBody(request, updateNoteSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);

    // Construct payload, handling nulls
    const updatePayload: Partial<Omit<UserNote, 'id' | 'user_id' | 'created_at' | 'updated_at'> > = {
        ...validationResult,
        related_resource_id: validationResult.related_resource_id ?? undefined,
        related_resource_type: validationResult.related_resource_type ?? undefined,
    };

    const userId = auth.user.id;
    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        // Authorization Check: Ensure user owns the note before updating
        const checkResponse = await noteDbService.getNoteById(noteId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Note not found', 'NOT_FOUND', 404);
        }
        if (checkResponse.data.user_id !== userId) { 
             return createErrorApiResponse('Forbidden: Cannot update this note', 'FORBIDDEN', 403);
        }

        // Perform update
        const updateResponse = await noteDbService.updateNote(noteId, updatePayload);
        if (updateResponse.error) throw updateResponse.error;
        return createSuccessApiResponse(updateResponse.data);
    } catch (error: any) {
        console.error(`[API /notes/${noteId} PUT] Error:`, error);
        return createErrorApiResponse('Failed to update note', 'UPDATE_NOTE_ERROR', 500);
    }
};
export const PUT = withAuth(updateNoteHandler);

/**
 * @swagger
 * /api/notes/{noteId}:
 *   delete:
 *     summary: Delete a specific note
 *     description: Deletes a note owned by the user.
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: noteId, in: path, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       204: { description: Note deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's note) }
 *       404: { description: Note not found }
 *       500: { description: Internal server error }
 */
const deleteNoteHandler = async (request: NextRequest, context: { params?: any }, auth: AuthenticatedContext) => {
    const noteId = context.params?.noteId as string | undefined;
    if (!noteId) return createErrorApiResponse('Note ID is required', 'VALIDATION_ERROR', 400);
    
    const userId = auth.user.id;
    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        // Authorization Check
        const checkResponse = await noteDbService.getNoteById(noteId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Note not found', 'NOT_FOUND', 404);
        }
        if (checkResponse.data.user_id !== userId) { 
             return createErrorApiResponse('Forbidden: Cannot delete this note', 'FORBIDDEN', 403);
        }

        // Perform delete
        const deleteResponse = await noteDbService.deleteNote(noteId);
        if (deleteResponse.error) throw deleteResponse.error;
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error: any) {
        console.error(`[API /notes/${noteId} DELETE] Error:`, error);
        return createErrorApiResponse('Failed to delete note', 'DELETE_NOTE_ERROR', 500);
    }
};
export const DELETE = withAuth(deleteNoteHandler); 