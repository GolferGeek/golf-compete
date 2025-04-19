import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { type Course } from '@/types/database';

// Schema for updating a course
const updateCourseSchema = z.object({
    name: z.string().min(3).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    phone_number: z.string().optional(),
    website: z.string().optional(),
    amenities: z.string().optional(),
    holes: z.number().optional(),
    par: z.number().optional(),
    is_active: z.boolean().optional()
}).partial();

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Get a specific course by ID
 *     description: Retrieves details for a single course, potentially including tees.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: include_tees
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Course details }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const includeTees = searchParams.get('include_tees') === 'true';

    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    try {
        let query = supabase
            .from('courses')
            .select(includeTees ? `*, tee_sets(*)` : '*')
            .eq('id', courseId)
            .single();

        const { data, error } = await query;

        if (error) throw error;
        if (!data) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        return createSuccessApiResponse(data);
    } catch (error: any) {
        console.error(`[API /courses/${courseId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch course', 'FETCH_COURSE_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/courses/{courseId}:
 *   patch:
 *     summary: Update a course
 *     description: Updates an existing golf course.
 *     tags: [Courses]
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
 *           schema: { $ref: '#/components/schemas/UpdateCourseInput' }
 *     responses:
 *       200: { description: Course updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const updateCourseHandler = async (request: NextRequest, { params }: { params: { courseId: string } }) => {
    const { courseId } = params;
    const supabase = await createClient();

    // Verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return createErrorApiResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (profileError || !profile?.is_admin) {
        return createErrorApiResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    try {
        const body = await request.json();
        const validatedData = updateCourseSchema.parse(body);

        const { data, error } = await supabase
            .from('courses')
            .update(validatedData)
            .eq('id', courseId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        return createSuccessApiResponse(data);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return createErrorApiResponse('Invalid request body', 'VALIDATION_ERROR', 400, error.errors);
        }
        console.error(`[API /courses/${courseId} PATCH] Error:`, error);
        return createErrorApiResponse('Failed to update course', 'UPDATE_COURSE_ERROR', 500);
    }
};

/**
 * @swagger
 * /api/courses/{courseId}:
 *   delete:
 *     summary: Delete a course
 *     description: Deletes an existing golf course.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Course deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const deleteCourseHandler = async (
    request: NextRequest,
    context: { params: { courseId: string } },
    auth: AuthenticatedContext
) => {
    const { courseId } = context.params;
    const userId = auth.user.id;
    const supabase = await createClient();

    try {
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.is_admin) {
            return createErrorApiResponse('Only admins can delete courses', 'FORBIDDEN', 403);
        }

        // Delete the course (cascade delete will handle related records)
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);

        if (error) throw error;
        return new Response(null, { status: 204 });

    } catch (error: any) {
        console.error(`[API /courses/${courseId} DELETE] Error:`, error);
        return createErrorApiResponse('Failed to delete course', 'DELETE_COURSE_ERROR', 500);
    }
};

export { updateCourseHandler as PATCH, deleteCourseHandler as DELETE }; 