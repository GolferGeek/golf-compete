import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';

// Schema for updating a simplified round
const updateRoundSchema = z.object({
  course_id: z.string().uuid().optional(),
  course_tee_id: z.string().uuid().optional(),
  bag_id: z.string().uuid().optional().nullable(),
  round_date: z.string().datetime().optional(),
  total_score: z.number().int().optional().nullable(),
  weather_conditions: z.string().optional().nullable(),
  course_conditions: z.string().optional().nullable(),
  temperature: z.number().int().optional().nullable(),
  wind_conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).partial();

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   get:
 *     summary: Get a specific simplified round by ID
 *     description: Retrieves details for a single round with total score and context.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Round details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not user's round) }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
async function getRoundHandler(
  request: NextRequest, 
  context: { params?: any },
  auth: AuthenticatedContext
) {
  try {
    const roundId = context.params?.roundId;

    if (!roundId) {
      return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('rounds')
      .select(`
        *,
        courses:course_id(id, name, description),
        tee_sets:course_tee_id(id, name, color, men_rating, women_rating, men_slope, women_slope),
        bags:bag_id(id, name, description)
      `)
      .eq('id', roundId)
      .eq('user_id', auth.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return createErrorApiResponse('Round not found', 'NOT_FOUND', 404);
    }

    return createSuccessApiResponse(data);
  } catch (error) {
    console.error(`[GET] /api/rounds/${context.params?.roundId} error:`, error);
    return createErrorApiResponse('Failed to fetch round', 'FETCH_ROUND_ERROR', 500);
  }
}

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   put:
 *     summary: Update a simplified round
 *     description: Updates details for a specific round including total score and context.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id: { type: string, format: uuid }
 *               course_tee_id: { type: string, format: uuid }
 *               bag_id: { type: string, format: uuid, nullable: true }
 *               round_date: { type: string, format: date-time }
 *               total_score: { type: integer, nullable: true }
 *               weather_conditions: { type: string, nullable: true }
 *               course_conditions: { type: string, nullable: true }
 *               temperature: { type: integer, nullable: true }
 *               wind_conditions: { type: string, nullable: true }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200: { description: Round updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (user cannot update this round) }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
async function updateRoundHandler(
  request: NextRequest, 
  context: { params?: any }, 
  auth: AuthenticatedContext
) {
  try {
    const roundId = context.params?.roundId;
    if (!roundId) {
      return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const validationResult = await validateRequestBody(request, updateRoundSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) {
      return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    // First verify the round exists and belongs to the user
    const { data: existingRound, error: fetchError } = await supabase
      .from('rounds')
      .select('id, user_id')
      .eq('id', roundId)
      .eq('user_id', auth.user.id)
      .single();

    if (fetchError || !existingRound) {
      return createErrorApiResponse('Round not found or access denied', 'NOT_FOUND', 404);
    }

    // Update the round
    const { data, error } = await supabase
      .from('rounds')
      .update({
        ...validationResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', roundId)
      .eq('user_id', auth.user.id)
      .select(`
        *,
        courses:course_id(id, name, description),
        tee_sets:course_tee_id(id, name, color, men_rating, women_rating, men_slope, women_slope),
        bags:bag_id(id, name, description)
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return createErrorApiResponse('Round not found', 'NOT_FOUND', 404);
    }

    return createSuccessApiResponse(data);
  } catch (error) {
    console.error(`[PUT] /api/rounds/${context.params?.roundId} error:`, error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid round data', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to update round', 'UPDATE_ROUND_ERROR', 500);
  }
}

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   delete:
 *     summary: Delete a simplified round
 *     description: Deletes a specific round. Requires ownership.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Round deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Round not found }
 *       500: { description: Internal server error }
 */
async function deleteRoundHandler(
  request: NextRequest, 
  context: { params?: any }, 
  auth: AuthenticatedContext
) {
  try {
    const roundId = context.params?.roundId;
    if (!roundId) {
      return createErrorApiResponse('Round ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    // Verify ownership before deletion
    const { data: existingRound, error: fetchError } = await supabase
      .from('rounds')
      .select('id, user_id')
      .eq('id', roundId)
      .eq('user_id', auth.user.id)
      .single();

    if (fetchError || !existingRound) {
      return createErrorApiResponse('Round not found or access denied', 'NOT_FOUND', 404);
    }

    const { error } = await supabase
      .from('rounds')
      .delete()
      .eq('id', roundId)
      .eq('user_id', auth.user.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE] /api/rounds/${context.params?.roundId} error:`, error);
    return createErrorApiResponse('Failed to delete round', 'DELETE_ROUND_ERROR', 500);
  }
}

export const GET = withAuth(getRoundHandler);
export const PUT = withAuth(updateRoundHandler);
export const DELETE = withAuth(deleteRoundHandler); 