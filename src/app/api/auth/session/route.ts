import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/services/internal/AuthService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/services/base';
import { type AuthProfile } from '@/services/internal/AuthService';
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
    // Use getSession to retrieve session without throwing error if none exists
    const sessionResponse = await authService.getSession();
    
    if (sessionResponse.error) {
      // Log the error but return null data, as no session is not necessarily a 500 error for this endpoint
      console.error('[API /auth/session] Error getting session:', sessionResponse.error);
      // Return success with null data matching SessionData structure
      return createSuccessApiResponse<SessionData | null>(null); 
    }

    // If session exists, try fetching profile
    let profileData: AuthProfile | null = null;
    if (sessionResponse.data?.user?.id) {
        const profileResponse = await authService.getUserProfile(sessionResponse.data.user.id);
        if (profileResponse.error) {
            console.warn('[API /auth/session] Could not fetch profile for session:', profileResponse.error.message);
            // Proceed without profile data
        } else {
            profileData = profileResponse.data;
        }
    }

    // Construct the data payload according to SessionData
    const responseData: SessionData = {
        user: sessionResponse.data?.user || null,
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