import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse, type ErrorResponse } from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';

// Schema for getting non-participants
const getNonParticipantsSchema = z.object({
  seriesId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
}).refine(data => data.seriesId || data.eventId, {
  message: "Either seriesId or eventId must be provided"
});

// Schema for adding a participant
const addParticipantSchema = z.object({
  seriesId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  role: z.enum(['participant', 'admin']).optional(),
  handicapIndex: z.number().optional(),
}).refine(data => data.seriesId || data.eventId, {
  message: "Either seriesId or eventId must be provided"
});

// Schema for updating a participant
const updateParticipantSchema = z.object({
  participantId: z.string().uuid(),
  role: z.enum(['participant', 'admin']).optional(),
  status: z.enum(['active', 'withdrawn', 'invited', 'registered', 'confirmed', 'no_show']).optional(),
  handicapIndex: z.number().optional(),
});

type AddParticipantInput = z.infer<typeof addParticipantSchema>;
type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;

type ValidationResult<T> = T | NextResponse<ErrorResponse>;

/**
 * @swagger
 * /api/participants:
 *   get:
 *     summary: Get non-participants for a series or event
 *     description: Retrieves users who are not participants in a specific series or event
 *     tags: [Participants]
 *     parameters:
 *       - in: query
 *         name: seriesId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: eventId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of non-participants }
 *       400: { description: Validation error }
 *       500: { description: Internal server error }
 */
const getNonParticipantsHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const { searchParams } = new URL(request.url);
  const params = {
    seriesId: searchParams.get('seriesId') || undefined,
    eventId: searchParams.get('eventId') || undefined,
  };

  const validation = getNonParticipantsSchema.safeParse(params);
  if (!validation.success) {
    return createErrorApiResponse(validation.error.message, 'VALIDATION_ERROR', 400);
  }

  const supabase = await createClient();

  try {
    let data;
    if (params.seriesId) {
      const { data: seriesData, error } = await supabase.rpc('get_non_series_participants', {
        p_series_id: params.seriesId,
      });
      if (error) throw error;
      data = seriesData;
    } else if (params.eventId) {
      const { data: eventData, error } = await supabase.rpc('get_non_event_participants', {
        p_event_id: params.eventId,
      });
      if (error) throw error;
      data = eventData;
    }

    return createSuccessApiResponse(data);
  } catch (error) {
    console.error('Error getting non-participants:', error);
    return createErrorApiResponse('Failed to get non-participants', 'FETCH_ERROR', 500);
  }
};

/**
 * @swagger
 * /api/participants:
 *   post:
 *     summary: Add a participant to a series or event
 *     description: Adds a user as a participant to a specific series or event
 *     tags: [Participants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddParticipantInput' }
 *     responses:
 *       201: { description: Participant added successfully }
 *       400: { description: Validation error }
 *       500: { description: Internal server error }
 */
const addParticipantHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const validationResult = await validateRequestBody(request, addParticipantSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  const input = validationResult;
  const supabase = await createClient();

  try {
    if (input.seriesId) {
      const { data, error } = await supabase
        .from('series_participants')
        .insert({
          series_id: input.seriesId,
          user_id: input.userId,
          role: input.role || 'participant',
          status: 'invited',
        })
        .select()
        .single();

      if (error) throw error;
      return createSuccessApiResponse(data, 201);
    } else if (input.eventId) {
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: input.eventId,
          user_id: input.userId,
          status: 'registered',
          handicap_index: input.handicapIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return createSuccessApiResponse(data, 201);
    }

    return createErrorApiResponse('Invalid request: missing seriesId or eventId', 'VALIDATION_ERROR', 400);
  } catch (error) {
    console.error('Error adding participant:', error);
    return createErrorApiResponse('Failed to add participant', 'INSERT_ERROR', 500);
  }
};

/**
 * @swagger
 * /api/participants:
 *   put:
 *     summary: Update a participant's details
 *     description: Updates role, status, or handicap index of a participant
 *     tags: [Participants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateParticipantInput' }
 *     responses:
 *       200: { description: Participant updated successfully }
 *       400: { description: Validation error }
 *       500: { description: Internal server error }
 */
const updateParticipantHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const validationResult = await validateRequestBody(request, updateParticipantSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  const input = validationResult;
  const supabase = await createClient();

  try {
    // First determine if this is a series or event participant
    const { data: seriesParticipant, error: seriesError } = await supabase
      .from('series_participants')
      .select()
      .eq('id', input.participantId)
      .maybeSingle();

    if (seriesError) throw seriesError;

    if (seriesParticipant) {
      // Update series participant
      const { data, error } = await supabase
        .from('series_participants')
        .update({
          role: input.role,
          status: input.status,
        })
        .eq('id', input.participantId)
        .select()
        .single();

      if (error) throw error;
      return createSuccessApiResponse(data);
    } else {
      // Update event participant
      const { data, error } = await supabase
        .from('event_participants')
        .update({
          status: input.status,
          handicap_index: input.handicapIndex,
        })
        .eq('id', input.participantId)
        .select()
        .single();

      if (error) throw error;
      return createSuccessApiResponse(data);
    }
  } catch (error) {
    console.error('Error updating participant:', error);
    return createErrorApiResponse('Failed to update participant', 'UPDATE_ERROR', 500);
  }
};

/**
 * @swagger
 * /api/participants:
 *   delete:
 *     summary: Remove a participant
 *     description: Removes a participant from a series or event
 *     tags: [Participants]
 *     parameters:
 *       - in: query
 *         name: participantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Participant removed successfully }
 *       400: { description: Validation error }
 *       500: { description: Internal server error }
 */
const deleteParticipantHandler = async (
  request: NextRequest,
  context: { params?: any },
  auth: AuthenticatedContext
) => {
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participantId');

  if (!participantId) {
    return createErrorApiResponse('Participant ID is required', 'VALIDATION_ERROR', 400);
  }

  const supabase = await createClient();

  try {
    // First try to delete from series_participants
    const { error: seriesError } = await supabase
      .from('series_participants')
      .delete()
      .eq('id', participantId);

    if (!seriesError) {
      return createSuccessApiResponse(null, 204);
    }

    // If not found in series_participants, try event_participants
    const { error: eventError } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participantId);

    if (eventError) throw eventError;
    return createSuccessApiResponse(null, 204);
  } catch (error) {
    console.error('Error removing participant:', error);
    return createErrorApiResponse('Failed to remove participant', 'DELETE_ERROR', 500);
  }
};

export const GET = withAuth(getNonParticipantsHandler);
export const POST = withAuth(addParticipantHandler);
export const PUT = withAuth(updateParticipantHandler);
export const DELETE = withAuth(deleteParticipantHandler); 