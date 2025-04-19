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

// Schema for creating a course
const createCourseSchema = z.object({
    name: z.string().min(3, { message: 'Course name must be at least 3 characters' }),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('USA'),
    phone_number: z.string().optional(),
    website: z.string().optional(),
    amenities: z.string().optional(),
    holes: z.number().default(18),
    par: z.number().default(72),
    is_active: z.boolean().default(true)
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List all courses
 *     description: Retrieves a list of all golf courses with optional filtering and pagination.
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: offset
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of courses }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const country = searchParams.get('country');

    const supabase = await createClient();

    try {
        let query = supabase
            .from('courses')
            .select('*', { count: 'exact' });

        // Apply filters if provided
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        if (city) {
            query = query.eq('city', city);
        }
        if (state) {
            query = query.eq('state', state);
        }
        if (country) {
            query = query.eq('country', country);
        }

        // Apply pagination
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('name');

        if (error) throw error;

        return createSuccessApiResponse({
            courses: data || [],
            total: count || 0,
            limit,
            offset
        });
    } catch (error: any) {
        console.error('[API /courses GET] Error:', error);
        return createErrorApiResponse('Failed to fetch courses', 'FETCH_COURSES_ERROR', 500);
    }
}

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     description: Creates a new golf course.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCourseInput' }
 *     responses:
 *       201: { description: Course created successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const createCourseHandler = async (
    request: NextRequest,
    context: { params?: any },
    auth: AuthenticatedContext
) => {
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
            return createErrorApiResponse('Only admins can create courses', 'FORBIDDEN', 403);
        }

        // Validate request body
        const validationResult = await validateRequestBody(request, createCourseSchema);
        if (validationResult instanceof Response) return validationResult;

        // Create the course
        const { data, error } = await supabase
            .from('courses')
            .insert({
                ...validationResult,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return createSuccessApiResponse(data, 201);

    } catch (error: any) {
        console.error('[API /courses POST] Error:', error);
        return createErrorApiResponse('Failed to create course', 'CREATE_COURSE_ERROR', 500);
    }
};

export { createCourseHandler as POST };
