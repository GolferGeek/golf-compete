import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import CourseDbService from '@/services/internal/CourseDbService';
import { 
    validateRequestBody, 
    validateQueryParams, 
    createSuccessApiResponse, 
    createErrorApiResponse 
} from '@/lib/api/utils';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { ServiceError } from '@/services/base';
import { type Course } from '@/types/database';

// Schema for creating/updating a course
const courseSchema = z.object({
  name: z.string().min(3, { message: 'Course name must be at least 3 characters' }),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  // created_by might be set automatically based on auth
});

const createCourseSchema = courseSchema; // Use the same for create
const updateCourseSchema = courseSchema.partial(); // All fields optional for update

// Schema for query parameters when fetching courses
const fetchCoursesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  page: z.coerce.number().int().positive().optional().default(1),
  sortBy: z.string().optional().default('name'),
  sortDir: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional(), // Add search parameter
  // Add other filters as needed (e.g., state)
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List golf courses
 *     description: Retrieves a paginated list of golf courses, optionally filtered and sorted.
 *     tags: [Courses]
 *     parameters: # Add query params like limit, page, sortBy, search etc.
 *       # ... (schema based on fetchCoursesQuerySchema)
 *     responses:
 *       200: { description: List of courses }
 *       400: { description: Invalid query parameters }
 *       500: { description: Internal server error }
 */
export async function GET(request: NextRequest) {
    const queryValidation = await validateQueryParams(request, fetchCoursesQuerySchema);
    if (queryValidation instanceof NextResponse) return queryValidation;

    const { limit, page, sortBy, sortDir, search } = queryValidation;
    const offset = (page - 1) * limit;

    const filters: Record<string, any> = {};
    if (search) filters.name = { ilike: search }; // Simple name search example
    // Add more filters

    let orFilterString: string | undefined = undefined;
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        orFilterString = `name.ilike.${searchTerm},city.ilike.${searchTerm},state.ilike.${searchTerm}`;
        // Add zip_code if needed, careful with ilike on non-text
    }

    const ordering = sortBy ? { column: sortBy, direction: sortDir } : undefined;

    const supabase = await createClient();
    const courseDbService = new CourseDbService(supabase);

    try {
        const response = await courseDbService.fetchCourses(
            { pagination: { limit, offset, page }, ordering, filters, orFilter: orFilterString }, 
            { useCamelCase: true }
        );
        if (response.error) throw response.error;
        return createSuccessApiResponse(response);
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
 *     description: Adds a new golf course to the database.
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }] # Assuming only logged-in users can add
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCourseInput' } # Based on createCourseSchema
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
    const validationResult = await validateRequestBody(request, createCourseSchema);
    if (validationResult instanceof NextResponse) return validationResult;

    // Construct payload, handling nulls and adding creator
    const coursePayload: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
        ...validationResult,
        address: validationResult.address ?? undefined,
        city: validationResult.city ?? undefined,
        state: validationResult.state ?? undefined,
        zip_code: validationResult.zip_code ?? undefined,
        phone: validationResult.phone ?? undefined,
        website: validationResult.website ?? undefined,
        created_by: auth.user.id, 
    };

    const supabase = await createClient();
    const courseDbService = new CourseDbService(supabase);

    try {
        const createResponse = await courseDbService.createCourse(coursePayload);
        if (createResponse.error || !createResponse.data) {
            throw createResponse.error || new Error('Failed to create course, no data returned');
        }
        return createSuccessApiResponse(createResponse.data, 201);
    } catch (error: any) {
        console.error('[API /courses POST] Error:', error);
        if (error instanceof ServiceError) {
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to create course', 'CREATE_COURSE_ERROR', 500);
    }
};

export const POST = withAuth(createCourseHandler);
