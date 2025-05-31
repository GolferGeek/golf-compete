import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import AuthService, { 
  type AuthProfile,
  type SessionResponse,
  type ProfileResponse
} from '@/api/internal/auth/AuthService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError, type ServiceResponse } from '@/api/base';
import { type User, type Session } from '@supabase/supabase-js';

// Define the structure for the session response data
interface SessionData {
    user: User | null;
    session: Session | null;
    profile: AuthProfile | null;
}

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Get current user session information
 *     description: Retrieves the current session and user data if authenticated.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Session data retrieved successfully (or null if not logged in).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     user:
 *                       type: object # Supabase User object structure
 *                       nullable: true
 *                     session:
 *                       type: object # Supabase Session object structure
 *                       nullable: true
 *                     profile:
 *                       type: object # Profile structure
 *                       nullable: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: NextRequest) {
  // This endpoint might be hit by unauthenticated users, so it shouldn't use withAuth
  const supabase = await createClient();
  const authService = new AuthService(supabase);

  try {
    // First, securely get the authenticated user
    const userResponse = await authService.getCurrentUser();
    
    if (userResponse.error) {
      // Authentication failed, return null data - no session
      // Don't log as warning since this is expected for anonymous users
      console.log('[API /auth/session] User not authenticated:', userResponse.error.message);
      return createSuccessApiResponse<SessionData | null>(null);
    }
    
    // If we have a valid user, get the session
    const sessionResponse = await authService.getSession();
    
    if (sessionResponse.error) {
      // Log the error but return null data, as no session is not necessarily a 500 error for this endpoint
      // Don't log as error since this is expected for anonymous users
      console.log('[API /auth/session] No valid session:', sessionResponse.error.message);
      // Return success with null data matching SessionData structure
      return createSuccessApiResponse<SessionData | null>(null); 
    }

    // If session exists, try fetching profile
    let profileData: AuthProfile | null = null;
    if (userResponse.data?.id) {
        const profileResponse = await authService.getUserProfile(userResponse.data.id);
        if (profileResponse.error) {
            console.warn('[API /auth/session] Could not fetch profile for session:', profileResponse.error.message);
            // Proceed without profile data
        } else {
            profileData = profileResponse.data;
        }
    }

    // Construct the data payload according to SessionData
    const responseData: SessionData = {
        user: userResponse.data,
        session: sessionResponse.data?.session || null,
        profile: profileData,
    };

    return createSuccessApiResponse<SessionData>(responseData);

  } catch (error: any) {
    console.error('[API /auth/session] Error:', error);
    // Return 500 for unexpected errors
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred checking session.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 