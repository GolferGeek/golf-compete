import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/api/internal/database/AuthService';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/api/base';
import { withAuth, type AuthenticatedContext } from '@/lib/api/withAuth';

// Validation schema for password update
const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

/**
 * @swagger
 * /api/auth/update-password:
 *   post:
 *     summary: Update user password
 *     description: Updates the password for the currently authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully.
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
 *                       example: "Password updated successfully."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad Request - Validation error or weak password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - User not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const updatePasswordHandler = async (
    request: NextRequest, 
    context: { params?: any }, 
    auth: AuthenticatedContext
) => {
  const validationResult = await validateRequestBody(request, updatePasswordSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  const { password } = validationResult;
  
  // Client is implicitly created/available via withAuth for service instantiation
  const supabase = await createClient();
  const authService = new AuthService(supabase);

  try {
    // AuthService.updatePassword uses the authenticated user from the client session
    const updateResponse = await authService.updatePassword({ password });

    if (updateResponse.error) {
      if (updateResponse.error instanceof ServiceError && 
          updateResponse.error.code === 'AUTH_WEAK_PASSWORD') {
        return createErrorApiResponse(updateResponse.error.message, updateResponse.error.code, 400);
      }
      // Handle other potential service errors
      return createErrorApiResponse(
        updateResponse.error.message,
        updateResponse.error instanceof ServiceError ? updateResponse.error.code : 'UPDATE_PASSWORD_FAILED',
        500
      );
    }

    return createSuccessApiResponse(
      {
        message: 'Password updated successfully.',
      },
      200
    );

  } catch (error: any) {
    console.error('[API /auth/update-password] Error:', error);
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred updating password.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};

// Wrap the handler with withAuth
export const POST = withAuth(updatePasswordHandler); 