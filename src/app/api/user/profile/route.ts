import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils'; // Import the response utilities
import { createClient } from '@/lib/supabase/server'; // Need this to create client
import AuthService from '@/services/internal/AuthService'; // Import service class

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