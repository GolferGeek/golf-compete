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
import { type CourseTee } from '@/types/database';

// Schema for creating a course tee
const createTeeSchema = z.object({
  // course_id will come from the URL parameter
  tee_name: z.string().min(1, { message: 'Tee name is required' }),
  gender: z.enum(['Male', 'Female', 'Unisex']),
  par: z.number().int().positive(),
  rating: z.number().positive(),
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
    // Properly await params before accessing properties
    const params_obj = await params;
    const courseId = params_obj.courseId;
    
    if (!courseId) {
        return createErrorApiResponse('Course ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = await createClient();

    try {
        // Get course with tees
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                tee_sets (*)
            `)
            .eq('id', courseId)
            .single();

        if (error) throw error;
        if (!data) {
            return createErrorApiResponse('Course not found', 'NOT_FOUND', 404);
        }
        
        // Return just the tees array
        return createSuccessApiResponse(data.tee_sets || []);

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
    // Properly await params before accessing properties
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
             return createErrorApiResponse('Forbidden: Only site admins can add course tees', 'FORBIDDEN', 403);
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

        // Add the tee
        const validationResult = await validateRequestBody(request, createTeeSchema);
        if (validationResult instanceof NextResponse) return validationResult;

        // Construct payload, handling nulls and adding course_id
        const teePayload: Omit<CourseTee, 'id'> = {
            ...validationResult,
            course_id: courseId,
            yardage: validationResult.yardage ?? undefined,
        };
        
        const { data, error } = await supabase
            .from('tee_sets')
            .insert(teePayload)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            throw new Error('Failed to add course tee, no data returned');
        }

        return createSuccessApiResponse(data, 201);

    } catch (error: any) {
        console.error(`[API /courses/${courseId}/tees POST] Error:`, error);
        return createErrorApiResponse('Failed to add course tee', 'ADD_TEE_ERROR', 500);
    }
};

export const POST = withAuth(addCourseTeeHandler); 