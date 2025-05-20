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
import AuthService from '@/api/internal/auth/AuthService';

// Schema for updating a hole
const updateHoleSchema = z.object({
  hole_number: z.number().int().min(1).max(18).optional(),
  par: z.number().int().min(3).max(5).optional(),
  handicap_index: z.number().int().min(1).max(18).optional(),
  yards: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
}).partial();

/**
 * @swagger
 * /api/courses/{courseId}/holes/{holeId}:
 *   put:
 *     summary: Update a specific course hole
 *     description: Updates details for a specific hole on a course
 *     tags: [Courses, Holes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: holeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateHoleInput' }
 *     responses:
 *       200: { description: Hole updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course or Hole not found }
 *       500: { description: Internal server error }
 */
const updateHoleHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    const holeId = context.params?.holeId as string | undefined;
    if (!courseId || !holeId) {
        return createErrorApiResponse('Course ID and Hole ID are required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can update course holes', 'FORBIDDEN', 403);
        }
        // --- End Authorization Check ---

        const validationResult = await validateRequestBody(request, updateHoleSchema);
        if (validationResult instanceof NextResponse) return validationResult;
        if (Object.keys(validationResult).length === 0) {
             return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
        }

        // Check if hole exists
        const { data: holeData, error: holeError } = await supabase
            .from('holes')
            .select('*')
            .eq('id', holeId)
            .eq('course_id', courseId)
            .single();

        if (holeError || !holeData) {
            return createErrorApiResponse('Hole not found', 'NOT_FOUND', 404);
        }

        // If hole number is being updated, check if it would create a duplicate
        if (validationResult.hole_number && validationResult.hole_number !== holeData.hole_number) {
            const { data: duplicateHole, error: duplicateHoleError } = await supabase
                .from('holes')
                .select('id')
                .eq('course_id', courseId)
                .eq('hole_number', validationResult.hole_number)
                .neq('id', holeId)
                .single();

            if (duplicateHole) {
                return createErrorApiResponse(
                    `Hole number ${validationResult.hole_number} already exists for this course`,
                    'DUPLICATE_HOLE',
                    400
                );
            }
        }

        // Perform update
        const { data: updatedHole, error: updateError } = await supabase
            .from('holes')
            .update({
                ...validationResult,
                notes: validationResult.notes ?? null
            })
            .eq('id', holeId)
            .select('*')
            .single();

        if (updateError) {
            throw updateError;
        }

        return createSuccessApiResponse(updatedHole);
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/holes/${holeId} PUT] Error:`, error);
        return createErrorApiResponse('Failed to update hole', 'UPDATE_HOLE_ERROR', 500);
    }
};

export const PUT = withAuth(updateHoleHandler);

/**
 * @swagger
 * /api/courses/{courseId}/holes/{holeId}:
 *   delete:
 *     summary: Delete a specific course hole
 *     description: Deletes a specific hole from a course
 *     tags: [Courses, Holes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: holeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Hole deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course or Hole not found }
 *       500: { description: Internal server error }
 */
const deleteHoleHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    const holeId = context.params?.holeId as string | undefined;
    if (!courseId || !holeId) {
        return createErrorApiResponse('Course ID and Hole ID are required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can delete course holes', 'FORBIDDEN', 403);
        }
        // --- End Authorization Check ---

        // Check if hole exists
        const { data: holeData, error: holeError } = await supabase
            .from('holes')
            .select('id')
            .eq('id', holeId)
            .eq('course_id', courseId)
            .single();

        if (holeError || !holeData) {
            return createErrorApiResponse('Hole not found', 'NOT_FOUND', 404);
        }

        // Perform delete
        const { error: deleteError } = await supabase
            .from('holes')
            .delete()
            .eq('id', holeId);

        if (deleteError) {
            throw deleteError;
        }

        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error: any) {
        console.error(`[API /courses/${courseId}/holes/${holeId} DELETE] Error:`, error);
        return createErrorApiResponse('Failed to delete hole', 'DELETE_HOLE_ERROR', 500);
    }
};

export const DELETE = withAuth(deleteHoleHandler); 