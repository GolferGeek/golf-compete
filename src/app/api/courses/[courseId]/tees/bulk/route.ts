import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/services/internal/AuthService';
import { 
    validateRequestBody, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';

// Schema for bulk tee operations - an array of tee sets
const bulkTeeSchema = z.array(
  z.object({
    tee_name: z.string().min(1),
    gender: z.enum(['Male', 'Female', 'Unisex']),
    rating: z.number().min(55).max(78),
    slope_rating: z.number().min(55).max(155),
    yardage: z.number().min(4000).max(8000).optional().nullable()
  })
);

/**
 * @swagger
 * /api/courses/{courseId}/tees/bulk:
 *   post:
 *     summary: Bulk update tee sets for a course
 *     description: Replaces all tee sets for a course with a new set
 *     tags: [Courses, Tees]
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
 *           schema: { type: array, items: { $ref: '#/components/schemas/CreateTeeInput' } }
 *     responses:
 *       200: { description: Tee sets updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (not admin) }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const bulkManageTeeHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
) => {
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
             return createErrorApiResponse('Forbidden: Only site admins can manage course tees', 'FORBIDDEN', 403);
        }
        
        // Check if course exists
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select()
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        // Validate request body
        const validationResult = await validateRequestBody(request, bulkTeeSchema);
        if (validationResult instanceof NextResponse) return validationResult;

        // Start a transaction to replace all tee sets
        const { error: deleteError } = await supabase
            .from('tee_sets')
            .delete()
            .eq('course_id', courseId);

        if (deleteError) throw deleteError;

        // Insert new tee sets
        const { data: newTeeSets, error: insertError } = await supabase
            .from('tee_sets')
            .insert(validationResult.map(tee => ({
                ...tee,
                course_id: courseId,
                yardage: tee.yardage ?? undefined
            })))
            .select();

        if (insertError) throw insertError;

        return createSuccessApiResponse(newTeeSets);
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees/bulk POST] Error:`, error);
        return createErrorApiResponse('Failed to update course tees', 'UPDATE_TEES_ERROR', 500);
    }
};

export { bulkManageTeeHandler as POST }; 