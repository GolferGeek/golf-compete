import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';

// Schema for creating a simplified round
const createRoundSchema = z.object({
  course_id: z.string().uuid(),
  course_tee_id: z.string().uuid(),
  bag_id: z.string().uuid().optional(),
  round_date: z.string().datetime().optional(),
  total_score: z.number().int().optional(),
  weather_conditions: z.string().optional(),
  course_conditions: z.string().optional(),
  temperature: z.number().int().optional(),
  wind_conditions: z.string().optional(),
  notes: z.string().optional(),
});

// Schema for updating a round
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

// Schema for query parameters when fetching rounds
const fetchRoundsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('round_date'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  courseId: z.string().uuid().optional(),
  bagId: z.string().uuid().optional(),
  dateAfter: z.string().datetime({ message: 'Invalid date format for dateAfter' }).optional(),
  dateBefore: z.string().datetime({ message: 'Invalid date format for dateBefore' }).optional(),
  hasScore: z.coerce.boolean().optional(),
});

/**
 * @swagger
 * /api/rounds:
 *   get:
 *     summary: List simplified rounds
 *     description: Retrieves a paginated list of simplified rounds with total scores.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: sortBy, in: query, schema: { type: string, default: 'round_date' } }
 *       - { name: sortDir, in: query, schema: { type: string, enum: [asc, desc], default: 'desc' } }
 *       - { name: courseId, in: query, schema: { type: string, format: uuid } }
 *       - { name: bagId, in: query, schema: { type: string, format: uuid } }
 *       - { name: dateAfter, in: query, schema: { type: string, format: date-time } }
 *       - { name: dateBefore, in: query, schema: { type: string, format: date-time } }
 *       - { name: hasScore, in: query, schema: { type: boolean } }
 *     responses:
 *       200: { description: List of rounds with pagination }
 *       400: { description: Invalid query parameters }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
async function getRoundsHandler(
  request: NextRequest,
  _: any,
  auth: AuthenticatedContext
) {
  try {
    const queryValidation = await validateQueryParams(request, fetchRoundsQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { 
      limit, 
      page, 
      sortBy, 
      sortDir, 
      courseId, 
      bagId,
      dateAfter,
      dateBefore,
      hasScore
    } = queryValidation;

    const offset = (page - 1) * limit;
    const supabase = await createClient();

    let query = supabase
      .from('rounds')
      .select(`
        *,
        courses:course_id(id, name),
        tee_sets:course_tee_id(id, name, color),
        bags:bag_id(id, name)
      `, { count: 'exact' })
      .eq('user_id', auth.user.id);

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (bagId) {
      query = query.eq('bag_id', bagId);
    }
    if (dateAfter) {
      query = query.gte('round_date', dateAfter);
    }
    if (dateBefore) {
      query = query.lte('round_date', dateBefore);
    }
    if (hasScore !== undefined) {
      if (hasScore) {
        query = query.not('total_score', 'is', null);
      } else {
        query = query.is('total_score', null);
      }
    }

    // Apply pagination and sorting
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(offset, offset + limit - 1);

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
    console.error('[GET] /api/rounds error:', error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid request parameters', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to fetch rounds', 'FETCH_ROUNDS_ERROR', 500);
  }
}

/**
 * @swagger
 * /api/rounds:
 *   post:
 *     summary: Create a new simplified round
 *     description: Creates a new round record with optional total score and context.
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_id, course_tee_id]
 *             properties:
 *               course_id: { type: string, format: uuid }
 *               course_tee_id: { type: string, format: uuid }
 *               bag_id: { type: string, format: uuid }
 *               round_date: { type: string, format: date-time }
 *               total_score: { type: integer }
 *               weather_conditions: { type: string }
 *               course_conditions: { type: string }
 *               temperature: { type: integer }
 *               wind_conditions: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Round created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
async function createRoundHandler(
  request: NextRequest, 
  _: any, 
  auth: AuthenticatedContext
) {
  try {
    const validationResult = await validateRequestBody(request, createRoundSchema);
    if (validationResult instanceof Response) return validationResult;

    const supabase = await createClient();

    // If bag_id is not provided, try to get user's default bag
    let bagId = validationResult.bag_id;
    if (!bagId) {
      const { data: defaultBag } = await supabase
        .from('bags')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('is_default', true)
        .single();
      
      bagId = defaultBag?.id;
    }

    const { data, error } = await supabase
      .from('rounds')
      .insert({
        ...validationResult,
        user_id: auth.user.id,
        bag_id: bagId,
        round_date: validationResult.round_date || new Date().toISOString()
      })
      .select(`
        *,
        courses:course_id(id, name),
        tee_sets:course_tee_id(id, name, color),
        bags:bag_id(id, name)
      `)
      .single();

    if (error) throw error;

    return createSuccessApiResponse(data, 201);
  } catch (error) {
    console.error('[POST] /api/rounds error:', error);
    if (error instanceof z.ZodError) {
      return createErrorApiResponse('Invalid round data', 'VALIDATION_ERROR', 400);
    }
    return createErrorApiResponse('Failed to create round', 'CREATE_ROUND_ERROR', 500);
  }
}

export const GET = withAuth(getRoundsHandler);
export const POST = withAuth(createRoundHandler); 