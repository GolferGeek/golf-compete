import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/api/base';
import AuthService from '@/api/internal/database/AuthService';

// Schema for creating/updating a hole
const holeSchema = z.object({
  hole_number: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(5),
  handicap_index: z.number().int().min(1).max(18),
  yards: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
});

const createHoleSchema = holeSchema;
const updateHoleSchema = holeSchema.partial();

/**
 * @swagger
 * /api/courses/{courseId}/holes:
 *   get:
 *     summary: List holes for a specific course
 *     description: Retrieves all holes associated with a given course ID
 *     tags: [Courses, Holes]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of holes for the course }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, context: { params: { courseId: string } }) {
    const params = await context.params;
    const courseId = params.courseId;
    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    try {
        // Check if course exists
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .single();

        if (courseError || !courseData) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        // Get holes for the course
        const { data: holesData, error: holesError } = await supabase
            .from('holes')
            .select('*')
            .eq('course_id', courseId)
            .order('hole_number');

        if (holesError) {
            throw holesError;
        }

        return createSuccessApiResponse(holesData || []);
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/holes GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch course holes', 'FETCH_HOLES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/courses/{courseId}/holes:
 *   post:
 *     summary: Add a hole to a course
 *     description: Adds a new hole to a specific course
 *     tags: [Courses, Holes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateHoleInput' }
 *     responses:
 *       201: { description: Hole created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const addCourseHoleHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    if (!courseId) {
        return createErrorApiResponse('Course ID is required in URL path', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can modify course holes', 'FORBIDDEN', 403);
        }

        // Check if course exists
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .single();

        if (courseError || !courseData) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        // Validate request body
        const validationResult = await validateRequestBody(request, createHoleSchema);
        if (validationResult instanceof NextResponse) return validationResult;

        // Check if hole number already exists for this course
        const { data: existingHole, error: existingHoleError } = await supabase
            .from('holes')
            .select('id')
            .eq('course_id', courseId)
            .eq('hole_number', validationResult.hole_number)
            .single();

        if (existingHole) {
            return createErrorApiResponse(
                `Hole number ${validationResult.hole_number} already exists for this course`,
                'DUPLICATE_HOLE',
                400
            );
        }

        // Create the hole
        const { data: newHole, error: createError } = await supabase
            .from('holes')
            .insert({
                course_id: courseId,
                ...validationResult,
                notes: validationResult.notes ?? null
            })
            .select('*')
            .single();

        if (createError) {
            throw createError;
        }

        return createSuccessApiResponse(newHole, 201);
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/holes POST] Error:`, error);
        return createErrorApiResponse('Failed to create hole', 'CREATE_HOLE_ERROR', 500);
    }
};

export const POST = withAuth(addCourseHoleHandler); 