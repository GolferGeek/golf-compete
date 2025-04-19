import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { createSuccessApiResponse, createErrorApiResponse, validateRequestBody } from '@/lib/api/utils';
import { ServiceError, ErrorCodes } from '@/services/base';

// Schema for creating/updating a note
const noteSchema = z.object({
  note_text: z.string().min(1, 'Note text is required'),
  category: z.string().default('general'),
  round_id: z.string().uuid().nullable().optional(),
  hole_number: z.number().min(1).max(18).nullable().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(['added', 'working_on', 'implemented']).default('added')
});

// Schema for filtering and sorting notes
const listNotesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'category', 'status', 'note_text']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['added', 'working_on', 'implemented']).optional(),
  roundId: z.string().uuid().optional(),
  holeNumber: z.coerce.number().int().min(1).max(18).optional(),
  tags: z.array(z.string()).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

// GET /api/notes - List notes with filtering, sorting, and pagination
async function getNotesHandler(
  request: NextRequest,
  _: any,
  auth: AuthenticatedContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = listNotesSchema.parse({
      ...params,
      tags: params.tags ? JSON.parse(params.tags as string) : undefined
    });

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      status,
      roundId,
      holeNumber,
      tags,
      fromDate,
      toDate
    } = validatedParams;

    const supabase = await createClient();
    let query = supabase
      .from('user_notes')
      .select('*', { count: 'exact' })
      .eq('profile_id', auth.user.id);

    // Apply filters
    if (search) {
      query = query.ilike('note_text', `%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (roundId) {
      query = query.eq('round_id', roundId);
    }
    if (holeNumber) {
      query = query.eq('hole_number', holeNumber);
    }
    if (tags?.length) {
      query = query.contains('tags', tags);
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate.toISOString());
    }
    if (toDate) {
      query = query.lte('created_at', toDate.toISOString());
    }

    // Apply pagination and sorting
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    return createSuccessApiResponse({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('[GET] /api/notes error:', error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid request parameters', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to fetch notes', 'FETCH_NOTES_ERROR', 500);
  }
}

// POST /api/notes - Create a new note
async function createNoteHandler(
  request: NextRequest,
  _: any,
  auth: AuthenticatedContext
) {
  try {
    const validationResult = await validateRequestBody(request, noteSchema);
    if (validationResult instanceof Response) return validationResult;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_notes')
      .insert({
        ...validationResult,
        profile_id: auth.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return createSuccessApiResponse(data, 201);
  } catch (error) {
    console.error('[POST] /api/notes error:', error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid note data', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to create note', 'CREATE_NOTE_ERROR', 500);
  }
}

// PUT /api/notes/[noteId] - Update a note
async function updateNoteHandler(
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) {
  try {
    const noteId = context.params?.noteId;
    if (!noteId) {
      return createErrorApiResponse('Note ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, noteSchema.partial());
    if (validationResult instanceof Response) return validationResult;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_notes')
      .update({
        ...validationResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('profile_id', auth.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return createErrorApiResponse('Note not found', 'NOT_FOUND', 404);
    }

    return createSuccessApiResponse(data);
  } catch (error) {
    console.error(`[PUT] /api/notes/${context.params?.noteId} error:`, error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid note data', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to update note', 'UPDATE_NOTE_ERROR', 500);
  }
}

// DELETE /api/notes/[noteId] - Delete a note
async function deleteNoteHandler(
  _: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) {
  try {
    const noteId = context.params?.noteId;
    if (!noteId) {
      return createErrorApiResponse('Note ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', noteId)
      .eq('profile_id', auth.user.id);

    if (error) throw error;
    return createSuccessApiResponse(null, 204);
  } catch (error) {
    console.error(`[DELETE] /api/notes/${context.params?.noteId} error:`, error);
    return createErrorApiResponse('Failed to delete note', 'DELETE_NOTE_ERROR', 500);
  }
}

export const GET = withAuth(getNotesHandler);
export const POST = withAuth(createNoteHandler);
export const PUT = withAuth(updateNoteHandler);
export const DELETE = withAuth(deleteNoteHandler); 