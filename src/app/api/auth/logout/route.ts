import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/api/internal/auth/AuthService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/api/base';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Signs out the user and clears their session cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful.
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
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Successfully logged out."
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
export async function POST(request: NextRequest) {
  // Logout needs to clear cookies, so it might require the middleware client approach.
  // However, Supabase client's signOut might handle cookie clearing through the 
  // configured request/response objects handled by the middleware.
  // Let's try with the standard server client first.
  const supabase = await createClient();
  const authService = new AuthService(supabase);

  try {
    const signOutResponse = await authService.signOut();

    if (signOutResponse.error) {
      // Handle potential service errors during sign out
      return createErrorApiResponse(
        signOutResponse.error.message,
        signOutResponse.error instanceof ServiceError ? signOutResponse.error.code : 'LOGOUT_FAILED',
        500
      );
    }

    // Logout successful. Session cookies should have been cleared by Supabase client via middleware.
    return createSuccessApiResponse(
      {
        message: 'Successfully logged out.',
      },
      200 // OK
    );

  } catch (error: any) {
    console.error('[API /auth/logout] Error:', error);
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred during logout.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 