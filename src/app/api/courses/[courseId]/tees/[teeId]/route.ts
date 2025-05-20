import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import AuthService from '@/api/internal/auth/AuthService';

// Schema for updating a course tee
const updateTeeSchema = z.object({
  tee_name: z.string().min(1).optional(),
  gender: z.enum(['Male', 'Female', 'Unisex']).optional(),
  par: z.number().int().positive().optional(),
  course_rating: z.number().positive().optional(),
  slope_rating: z.number().int().positive().optional(),
  yardage: z.number().int().positive().optional().nullable(),
}).partial();

/**
 * @swagger
 * /api/courses/{courseId}/tees/{teeId}:
 *   put:
 *     summary: Update a specific course tee
 *     description: Updates details for a specific tee set on a course.
 *     tags: [Courses, Tees]
 *     security: [{ bearerAuth: [] }] # Assuming admin rights needed
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: teeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCourseTeeInput' } # Based on updateTeeSchema
 *     responses:
 *       200: { description: Tee updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course or Tee not found }
 *       500: { description: Internal server error }
 */
const updateCourseTeeHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    const teeId = context.params?.teeId as string | undefined;
    if (!courseId || !teeId) {
        return createErrorApiResponse('Course ID and Tee ID are required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can update course tees', 'FORBIDDEN', 403);
        }

        const validationResult = await validateRequestBody(request, updateTeeSchema);
        if (validationResult instanceof NextResponse) return validationResult;
        if (Object.keys(validationResult).length === 0) {
             return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
        }

        // Construct payload, handling nulls
        const updatePayload = {
            ...validationResult,
            yardage: validationResult.yardage ?? undefined,
        };
        
        // Update the tee directly
        const { data, error } = await supabase
            .from('tee_sets')
            .update(updatePayload)
            .eq('id', teeId)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return createErrorApiResponse('Tee not found', 'NOT_FOUND', 404);
        }

        return createSuccessApiResponse(data);

    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees/${teeId} PUT] Error:`, error);
        return createErrorApiResponse('Failed to update course tee', 'UPDATE_TEE_ERROR', 500);
    }
};

export const PUT = withAuth(updateCourseTeeHandler);

/**
 * @swagger
 * /api/courses/{courseId}/tees/{teeId}:
 *   delete:
 *     summary: Delete a specific course tee
 *     description: Deletes a specific tee set from a course.
 *     tags: [Courses, Tees]
 *     security: [{ bearerAuth: [] }] # Assuming admin rights needed
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: teeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Tee deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course or Tee not found }
 *       500: { description: Internal server error }
 */
const deleteCourseTeeHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    const teeId = context.params?.teeId as string | undefined;
    if (!courseId || !teeId) {
        return createErrorApiResponse('Course ID and Tee ID are required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can delete course tees', 'FORBIDDEN', 403);
        }

        // Delete the tee directly
        const { error } = await supabase
            .from('tee_sets')
            .delete()
            .eq('id', teeId);

        if (error) throw error;

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees/${teeId} DELETE] Error:`, error);
        return createErrorApiResponse('Failed to delete course tee', 'DELETE_TEE_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteCourseTeeHandler); 