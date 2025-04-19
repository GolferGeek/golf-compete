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

// Enhanced UserNote interface that includes metadata, which seems to be missing from the original definition
interface EnhancedUserNote extends Omit<UserNote, 'related_resource_type'> {
    metadata?: Record<string, any>;
    related_resource_type?: string; // Allow any string instead of restricting to specific types
    // Legacy fields for compatibility
    note_text?: string;
    category?: string;
    round_id?: string;
    hole_number?: number;
    tags?: string[];
    round_date?: string;
    course_name?: string;
}

// Schema for creating a note
const createNoteSchema = z.object({
  note_text: z.string().min(1, { message: 'Note content cannot be empty' }),
  category: z.string().optional(),
  round_id: z.string().uuid().optional().nullable(),
  hole_number: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for query parameters when fetching notes
const fetchNotesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(50),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().uuid().optional(),
  roundId: z.string().uuid().optional(),
  holeNumber: z.coerce.number().int().positive().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.string().optional(),
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

    const { limit, page, sortBy, sortOrder, userId, roundId, holeNumber, category, search } = queryValidation;
    const offset = (page - 1) * limit;
    const currentUserId = auth.user.id;
    
    // Check if user is admin
    const supabase = await createClient();
    const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUserId)
        .single();
        
    const isAdmin = profileData?.is_admin || false;
    
    // Only allow querying for current user's notes or admin users
    const targetUserId = userId || currentUserId;
    if (targetUserId !== currentUserId && !isAdmin) {
        return createErrorApiResponse('Cannot access notes for other users', 'FORBIDDEN', 403);
    }

    // Construct filters - ALWAYS filter by user_id for this endpoint
    const filters: Record<string, any> = { user_id: targetUserId };
    
    // Map client params to database fields
    if (roundId) {
        filters.related_resource_id = roundId;
        filters.related_resource_type = 'round';
    }
    if (holeNumber) {
        // We'll assume metadata is stored as a JSONB column that can be queried
        filters['metadata->hole_number'] = holeNumber;
    }
    if (category) {
        if (Array.isArray(category)) {
            filters.related_resource_type = category;
        } else {
            filters.related_resource_type = category;
        }
    }
    if (search) {
        filters.content = { ilike: `%${search}%` };
    }

    const ordering = sortBy ? { column: sortBy, direction: sortOrder } : undefined;

    const noteDbService = new NoteDbService(supabase);

    try {
        const response = await noteDbService.fetchNotes(
            { pagination: { limit, offset, page }, ordering, filters }, 
            { useCamelCase: true }
        );
        
        if (response.error) throw response.error;
        
        // Transform the data to match our client-side model
        const transformedData = (response.data || []).map(note => {
            const noteData = note as unknown as EnhancedUserNote;
            
            // Map from database model to our client API model
            return {
                ...noteData,
                content: noteData.content || '',
                // For backwards compatibility with the component
                note_text: noteData.content || '',
                category: noteData.related_resource_type || '',
                round_id: noteData.related_resource_type === 'round' ? noteData.related_resource_id : null,
                hole_number: noteData.metadata?.hole_number,
                tags: noteData.metadata?.tags || [],
                // Include joins data in the format the component expects
                rounds: noteData.related_resource_type === 'round' && noteData.related_resource_id ? {
                    date: noteData.metadata?.round_date,
                    courses: {
                        name: noteData.metadata?.course_name
                    }
                } : undefined
            };
        });
        
        // Return with the transformed data
        return createSuccessApiResponse({
            ...response,
            data: transformedData
        });
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

    // Map the client payload to the database model
    const notePayload: Omit<EnhancedUserNote, 'id' | 'created_at' | 'updated_at'> = {
        user_id: auth.user.id,
        content: validationResult.note_text,
        related_resource_id: validationResult.round_id || undefined,
        related_resource_type: validationResult.round_id ? 'round' : validationResult.category,
        // Store additional data in metadata
        metadata: {
            ...validationResult.metadata,
            tags: validationResult.tags || [],
            hole_number: validationResult.hole_number
        }
    };

    const supabase = await createClient();
    const noteDbService = new NoteDbService(supabase);

    try {
        const createResponse = await noteDbService.createNote(notePayload as any);
        if (createResponse.error || !createResponse.data) {
            throw createResponse.error || new Error('Failed to create note, no data returned');
        }
        
        // Convert to EnhancedUserNote to access metadata
        const createdNote = createResponse.data as unknown as EnhancedUserNote;
        
        // Transform the data to match our client-side model
        const transformedData = {
            ...createdNote,
            note_text: createdNote.content,
            category: createdNote.related_resource_type || '',
            round_id: createdNote.related_resource_type === 'round' ? createdNote.related_resource_id : null,
            hole_number: createdNote.metadata?.hole_number,
            tags: createdNote.metadata?.tags || []
        };
        
        return createSuccessApiResponse(transformedData, 201);
    } catch (error: any) {
        console.error('[API /notes POST] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to create note', 'CREATE_NOTE_ERROR', 500);
    }
};

export const POST = withAuth(createNoteHandler);

/**
 * Delete notes in bulk based on filter criteria
 */
const deleteNotesHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
) => {
    const queryValidation = await validateQueryParams(request, fetchNotesQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { userId, roundId, holeNumber, category, search } = queryValidation;
    const currentUserId = auth.user.id;
    
    // Check if user is admin
    const supabase = await createClient();
    const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUserId)
        .single();
        
    const isAdmin = profileData?.is_admin || false;
    
    // Only allow deleting current user's notes or admin users
    const targetUserId = userId || currentUserId;
    if (targetUserId !== currentUserId && !isAdmin) {
        return createErrorApiResponse('Cannot delete notes for other users', 'FORBIDDEN', 403);
    }

    // Construct filters - ALWAYS filter by user_id for this endpoint
    const filters: Record<string, any> = { user_id: targetUserId };
    
    // Map client params to database fields
    if (roundId) {
        filters.related_resource_id = roundId;
        filters.related_resource_type = 'round';
    }
    if (holeNumber) {
        // We'll assume metadata is stored as a JSONB column that can be queried
        filters['metadata->hole_number'] = holeNumber;
    }
    if (category) {
        if (Array.isArray(category)) {
            filters.related_resource_type = category;
        } else {
            filters.related_resource_type = category;
        }
    }
    if (search) {
        filters.content = { ilike: `%${search}%` };
    }

    const noteDbService = new NoteDbService(supabase);

    try {
        // First, count the notes that will be deleted
        // Use fetchNotes with count option instead of a separate countNotes method
        const countQuery = { 
            filters,
            pagination: { limit: 1, page: 1, offset: 0 },
            count: true
        };
        
        const countResponse = await noteDbService.fetchNotes(countQuery);
        if (countResponse.error) throw countResponse.error;
        
        const count = countResponse.metadata?.total || 0;
        
        if (count === 0) {
            return createSuccessApiResponse({ 
                message: 'No notes found matching the criteria',
                count: 0
            });
        }
        
        // Perform the deletion by calling delete multiple times (batch delete)
        // or by using a custom deleteNotes method if available
        let deleteCount = 0;
        
        // Method 1: If the database service supports batch delete
        try {
            const deleteResponse = await supabase
                .from('user_notes')
                .delete()
                .match(filters);
                
            if (deleteResponse.error) throw deleteResponse.error;
            deleteCount = count;
        } catch (err) {
            console.error('Batch delete failed, falling back to individual deletes:', err);
            
            // Method 2: Fallback to individual deletes if batch delete fails or is not available
            const notesToDelete = await noteDbService.fetchNotes({
                filters,
                pagination: { limit: 1000, offset: 0 } // Get all matching notes
            });
            
            if (notesToDelete.error) throw notesToDelete.error;
            
            if (notesToDelete.data && notesToDelete.data.length > 0) {
                for (const note of notesToDelete.data) {
                    const deleteResponse = await noteDbService.deleteNote(note.id);
                    if (!deleteResponse.error) deleteCount++;
                }
            }
        }
        
        return createSuccessApiResponse({ 
            message: `Successfully deleted ${deleteCount} note(s)`,
            count: deleteCount
        });
    } catch (error: any) {
        console.error('[API /notes DELETE] Error:', error);
        return createErrorApiResponse('Failed to delete notes', 'DELETE_NOTES_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteNotesHandler); 