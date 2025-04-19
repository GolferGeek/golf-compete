import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { createSuccessApiResponse, createErrorApiResponse, validateRequestBody } from '@/lib/api/utils'; // Import the response utilities
import { createClient } from '@/lib/supabase/server'; // Need this to create client
import AuthService from '@/api/internal/database/AuthService'; // Import service class
import { type AuthProfile } from '@/api/internal/database/AuthService'; // Import from AuthService
import { ServiceError, ErrorCodes } from '@/api/base'; // Import ServiceError and ErrorCodes
import { z } from 'zod';

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Retrieve the authenticated user's profile
 *     description: Fetches the profile information for the currently logged-in user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Indicates authentication is required
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data: # Reference the AuthProfile interface from AuthService
 *                   type: object
 *                   properties:
 *                     id: 
 *                       type: string
 *                     first_name: 
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     username:
 *                       type: string
 *                     handicap:
 *                       type: number
 *                     is_admin:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - No active session or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse' # Assume generic error schema defined elsewhere
 *       500:
 *         description: Internal Server Error - Failed to fetch profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getProfileHandler = async (
  request: NextRequest, 
  context: { params?: any }, 
  auth: AuthenticatedContext // Provided by withAuth
) => {
  const { user } = auth; // Destructure user from the injected auth context
  
  // Await client creation
  const supabase = await createClient(); 
  // Instantiate service with the request-specific client
  const authService = new AuthService(supabase);

  try {
    // Fetch full profile using the instantiated service
    const profileResponse = await authService.getUserProfile(user.id);
    
    if (profileResponse.error) {
      // Let the withAuth wrapper handle ServiceErrors
      throw profileResponse.error;
    }

    if (!profileResponse.data) {
      // Use the standardized error response for specific cases not caught by service
      return createErrorApiResponse('User profile not found', 'PROFILE_NOT_FOUND', 404);
    }

    // Use the standardized success response format
    return createSuccessApiResponse(profileResponse.data);
  } catch (error) {
    // Catch unexpected errors during service call or processing
    // Log here if needed, but withAuth should generally catch and format the final response
    console.error('[API /user/profile] Error fetching profile:', error);
    // Re-throw for the withAuth handler to catch and format
    throw error; 
  }
};

// Wrap the handler with withAuth to protect the route
export const GET = withAuth(getProfileHandler); 

// Schema for updating profile
const updateProfileSchema = z.object({
    // Allow updating specific fields
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    username: z.string().min(3).optional().nullable(),
    handicap: z.number().optional().nullable(),
    // is_admin, role etc. should likely NOT be updatable by user directly
    // multiple_clubs_sets: z.boolean().optional(), // Example
}).partial(); // Allow partial updates

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Updates profile details for the currently logged-in user.
 *     tags: [User, Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfileInput' } # Based on updateProfileSchema
 *     responses:
 *       200: { description: Profile updated successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
const updateProfileHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
    const validationResult = await validateRequestBody(request, updateProfileSchema);
    if (validationResult instanceof NextResponse) return validationResult;
    if (Object.keys(validationResult).length === 0) {
         return createErrorApiResponse('No update data provided', 'VALIDATION_ERROR', 400);
    }

    // Construct payload, handling nulls -> undefined
    const updatePayload: Partial<Omit<AuthProfile, 'id' | 'is_admin' | 'created_at' | 'updated_at'> > = {
        first_name: validationResult.first_name ?? undefined,
        last_name: validationResult.last_name ?? undefined,
        username: validationResult.username ?? undefined,
        handicap: validationResult.handicap ?? undefined,
        // Add other updatable fields here
    };
    
    const userId = auth.user.id;
    const supabase = await createClient(); 
    const authService = new AuthService(supabase);

    try {
        // First check if the profile exists
        const profileResponse = await authService.getUserProfile(userId);
        
        if (profileResponse.error && 
            profileResponse.error instanceof ServiceError && 
            profileResponse.error.code === ErrorCodes.DB_NOT_FOUND) {
            console.log('Profile not found, creating new profile');
            
            // Create a full profile payload with the user's ID
            const createPayload: Partial<AuthProfile> = {
                id: userId,
                ...updatePayload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            
            // Use the private createUserProfile method via a workaround
            // We need to access the method using indexing since it's private
            const createResponse = await (authService as any).createUserProfile(createPayload);
            
            if (createResponse.error) throw createResponse.error;
            if (!createResponse.data) throw new Error('Profile data missing after creation');
            
            return createSuccessApiResponse(createResponse.data);
        } else if (profileResponse.error) {
            // If there was an error but not DB_NOT_FOUND
            throw profileResponse.error;
        }

        // Profile exists, update it
        const updateResponse = await authService.updateProfile(userId, updatePayload);

        if (updateResponse.error) throw updateResponse.error;
        if (!updateResponse.data) throw new Error('Profile data missing after update');

        return createSuccessApiResponse(updateResponse.data);

    } catch (error: any) {
        console.error('[API /user/profile PUT] Error:', error);
        if (error instanceof ServiceError) {
            // Check for unique constraint violations (usually username)
            if (error.message && error.message.includes('unique constraint')) {
                return createErrorApiResponse('Username already taken', 'USERNAME_TAKEN', 400);
            }
            return createErrorApiResponse(error.message, error.code, 400);
        }
        return createErrorApiResponse('Failed to update profile', 'UPDATE_PROFILE_ERROR', 500);
    }
};

export const PUT = withAuth(updateProfileHandler); 