import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import CourseDbService from '@/services/internal/CourseDbService';
import { 
    validateRequestBody,
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError, ErrorCodes } from '@/services/base';
import { type Course } from '@/types/database';
import AuthService from '@/services/internal/AuthService';

// Re-use schema from ../route.ts or define locally if needed
const updateCourseSchema = z.object({
  name: z.string().min(3).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
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
    const courseDbService = new CourseDbService(supabase);

    try {
        let response;
        if (includeTees) {
            response = await courseDbService.getCourseWithTees(courseId);
        } else {
            response = await courseDbService.getCourseById(courseId);
        }

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Course not found', response.error.code, 404);
            }
            throw response.error;
        }
        if (!response.data) {
             return createErrorApiResponse('Course not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        return createSuccessApiResponse(response.data);
    } catch (error: any) {
        console.error(`[API /courses/${courseId} GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch course', 'FETCH_COURSE_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/courses/{courseId}:
 *   put:
 *     summary: Update a course
 *     description: Updates details for a specific course.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }] # May need admin rights
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCourseInput' } # Based on updateCourseSchema
 *     responses:
 *       200: { description: Course updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const updateCourseHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }

    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    const courseDbService = new CourseDbService(supabase);

    try {
        // Check if Site Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can update courses', 'FORBIDDEN', 403);
        }

        // Fetch course first to ensure it exists before update
        const checkResponse = await courseDbService.getCourseById(courseId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }

        // Perform update ...
        const validationResult = await validateRequestBody(request, updateCourseSchema);
        if (validationResult instanceof NextResponse) return validationResult;
        if (Object.keys(validationResult).length === 0) {
             return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
        }

        // Construct payload, handling nulls
        const updatePayload: Partial<Omit<Course, 'id' | 'created_by' | 'created_at' | 'updated_at'>> = {
            ...validationResult,
            address: validationResult.address ?? undefined,
            city: validationResult.city ?? undefined,
            state: validationResult.state ?? undefined,
            zip_code: validationResult.zip_code ?? undefined,
            phone: validationResult.phone ?? undefined,
            website: validationResult.website ?? undefined,
        };
        
        const updateResponse = await courseDbService.updateCourse(courseId, updatePayload);
        if (updateResponse.error) throw updateResponse.error;

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error(`[API /courses/${courseId} PUT] Error:`, error);
        if (error instanceof ServiceError) {
            let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 400;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to update course', 'UPDATE_COURSE_ERROR', 500);
    }
};

export const PUT = withAuth(updateCourseHandler);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   delete:
 *     summary: Delete a course
 *     description: Deletes a specific course. Requires admin rights.
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
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const courseId = context.params?.courseId as string | undefined;
    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }
    const userId = auth.user.id;
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    const courseDbService = new CourseDbService(supabase);

    try {
        // Check if Site Admin
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can delete courses', 'FORBIDDEN', 403);
        }

        // Optional: Check if course exists before attempting delete
        // const checkResponse = await courseDbService.getCourseById(courseId);
        // if (!checkResponse.data || checkResponse.error) { ... return 404 ... }

        // Perform delete ...
        const deleteResponse = await courseDbService.deleteCourse(courseId);
        if (deleteResponse.error) throw deleteResponse.error;

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error(`[API /courses/${courseId} DELETE] Error:`, error);
        if (error instanceof ServiceError) {
             let status = error.code === ErrorCodes.DB_NOT_FOUND ? 404 : 500;
            return createErrorApiResponse(error.message, error.code, status);
        }
        return createErrorApiResponse('Failed to delete course', 'DELETE_COURSE_ERROR', 500);
    }
};

// Require auth for delete, implement role check inside
export const DELETE = withAuth(deleteCourseHandler); 