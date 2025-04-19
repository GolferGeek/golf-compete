import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import CourseDbService from '@/services/internal/CourseDbService';
import AuthService from '@/services/internal/AuthService';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';

// Schema for bulk hole operations - an array of holes
const bulkHoleSchema = z.array(
  z.object({
    hole_number: z.number().int().min(1).max(18),
    par: z.number().int().min(3).max(5),
    handicap_index: z.number().int().min(1).max(18),
    notes: z.string().optional().nullable(),
  })
);

/**
 * @swagger
 * /api/courses/{courseId}/holes/bulk:
 *   post:
 *     summary: Replace all holes for a course
 *     description: Replaces all existing holes for a course with new ones in a single operation
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
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateHoleInput'
 *     responses:
 *       200: { description: Holes replaced successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const bulkManageHolesHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    // Access params safely, ensuring it exists before using it
    const params = await context.params;
    if (!params) {
        return createErrorApiResponse('Course ID is required in URL path', 'VALIDATION_ERROR', 400);
    }
    
    const courseId = params.courseId as string | undefined;
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
             return createErrorApiResponse('Forbidden: Only site admins can manage course holes', 'FORBIDDEN', 403);
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
        // --- End Authorization Check ---

        // Validate request body
        const validationResult = await validateRequestBody(request, bulkHoleSchema);
        if (validationResult instanceof NextResponse) return validationResult;

        // Skip RPC attempt since we know it doesn't exist
        // Use direct database operations instead
        
        // 1. Delete existing holes
        const { error: deleteError } = await supabase
            .from('holes')
            .delete()
            .eq('course_id', courseId);
        
        if (deleteError) {
            console.error('Error deleting existing holes:', deleteError);
            return createErrorApiResponse(
                `Failed to delete existing holes: ${deleteError.message}`,
                'DELETE_HOLES_ERROR',
                500
            );
        }
        
        // 2. Insert new holes
        const { error: insertError } = await supabase
            .from('holes')
            .insert(validationResult.map(hole => ({
                ...hole,
                course_id: courseId,
                notes: hole.notes ?? null
            })));
        
        if (insertError) {
            console.error('Error inserting new holes:', insertError);
            return createErrorApiResponse(
                `Failed to insert new holes: ${insertError.message}`,
                'INSERT_HOLES_ERROR',
                500
            );
        }

        // Get the updated holes
        const { data: holesData, error: holesError } = await supabase
            .from('holes')
            .select('*')
            .eq('course_id', courseId)
            .order('hole_number');

        if (holesError) {
            return createErrorApiResponse(
                'Holes were updated but failed to retrieve them',
                'FETCH_HOLES_ERROR',
                500
            );
        }

        return createSuccessApiResponse(holesData || []);
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/holes/bulk POST] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to update course holes', 'UPDATE_HOLES_ERROR', 500);
    }
};

export const POST = withAuth(bulkManageHolesHandler); 