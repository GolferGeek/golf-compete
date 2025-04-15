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
import { type CourseTee } from '@/types/database';

// Schema for creating a course tee
const createTeeSchema = z.object({
  // course_id will come from the URL parameter
  tee_name: z.string().min(1, { message: 'Tee name is required' }),
  gender: z.enum(['Male', 'Female', 'Unisex']),
  par: z.number().int().positive(),
  course_rating: z.number().positive(),
  slope_rating: z.number().int().positive(),
  yardage: z.number().int().positive().optional().nullable(),
});

/**
 * @swagger
 * /api/courses/{courseId}/tees:
 *   get:
 *     summary: List tees for a specific course
 *     description: Retrieves all tee sets associated with a given course ID.
 *     tags: [Courses, Tees]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of tees for the course }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
    const { courseId } = params;
    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();
    const courseDbService = new CourseDbService(supabase);

    try {
        // Use the getCourseWithTees method and extract tees
        const response = await courseDbService.getCourseWithTees(courseId);

        if (response.error) {
            if (response.error instanceof ServiceError && response.error.code === ErrorCodes.DB_NOT_FOUND) {
                return createErrorApiResponse('Course not found', response.error.code, 404);
            }
            throw response.error;
        }
        if (!response.data) {
             return createErrorApiResponse('Course not found', ErrorCodes.DB_NOT_FOUND, 404);
        }
        
        // Return just the tees array
        return createSuccessApiResponse(response.data.tees || []);

    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees GET] Error:`, error);
        return createErrorApiResponse('Failed to fetch course tees', 'FETCH_TEES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/courses/{courseId}/tees:
 *   post:
 *     summary: Add a tee to a course
 *     description: Adds a new tee set to a specific course.
 *     tags: [Courses, Tees]
 *     security: [{ bearerAuth: [] }] # Assuming admin/creator rights needed
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCourseTeeInput' } # Based on createTeeSchema
 *     responses:
 *       201: { description: Tee created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Course not found }
 *       500: { description: Internal server error }
 */
const addCourseTeeHandler = async (
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
    const courseDbService = new CourseDbService(supabase);

    try {
        // --- Authorization Check --- 
        const isAdminResponse = await authService.isUserAdmin(userId);
        if (isAdminResponse.data !== true) {
             return createErrorApiResponse('Forbidden: Only site admins can add course tees', 'FORBIDDEN', 403);
        }
        // Check if course exists (implicit check)
        const checkResponse = await courseDbService.getCourseById(courseId);
        if (!checkResponse.data || checkResponse.error) {
             return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }
        // --- End Authorization Check ---

        // Add the tee
        const validationResult = await validateRequestBody(request, createTeeSchema);
        if (validationResult instanceof NextResponse) return validationResult;

        // Construct payload, handling nulls and adding course_id
        const teePayload: Omit<CourseTee, 'id'> = {
            ...validationResult,
            course_id: courseId,
            yardage: validationResult.yardage ?? undefined,
        };
        
        const addResponse = await courseDbService.addCourseTee(teePayload);
        if (addResponse.error || !addResponse.data) {
            throw addResponse.error || new Error('Failed to add course tee, no data returned');
        }
        return createSuccessApiResponse(addResponse.data, 201);

    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees POST] Error:`, error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to add course tee', 'ADD_TEE_ERROR', 500);
    }
};

export const POST = withAuth(addCourseTeeHandler); 