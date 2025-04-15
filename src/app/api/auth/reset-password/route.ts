import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/services/internal/AuthService';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/services/base';

// Validation schema for password reset request
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Initiate password reset
 *     description: Sends a password reset link to the user's email address.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully (even if email not found, for security).
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
 *                       example: "Password reset email sent if account exists."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad Request - Validation error.
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
export async function POST(request: NextRequest) {
  const validationResult = await validateRequestBody(request, resetPasswordSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  const { email } = validationResult;

  // Determine the redirect URL for the password update page
  // Ensure this page exists in your frontend routing
  const origin = request.nextUrl.origin;
  const redirectTo = `${origin}/auth/update-password`; // Or your chosen update page route

  const supabase = await createClient();
  const authService = new AuthService(supabase);

  try {
    const resetResponse = await authService.resetPassword({ email, redirectTo });

    // IMPORTANT: For security, don't reveal if the email exists or not.
    // Always return a success response even if the service method might indicate user not found.
    if (resetResponse.error) {
        // Log the actual error internally, but don't expose details to the client
        console.error('[API /auth/reset-password] Error sending reset email:', resetResponse.error);
    }

    // Return a generic success message regardless of whether the email was found
    return createSuccessApiResponse(
      {
        message: 'If an account with this email exists, a password reset link has been sent.',
      },
      200 // OK
    );

  } catch (error: any) {
    // Catch unexpected errors during the service call
    console.error('[API /auth/reset-password] Unexpected Error:', error);
    // Still return a generic success message to avoid leaking information
     return createSuccessApiResponse(
      {
        message: 'If an account with this email exists, a password reset link has been sent.',
      },
      200 // OK
    );
    // Potentially log a more severe error internally
    // return createErrorApiResponse(error.message || 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
  }
} 