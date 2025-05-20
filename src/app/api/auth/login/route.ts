import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/api/internal/auth/AuthService';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/api/base';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user with email and password and sets session cookies.
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
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful.
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
 *                     userId:
 *                       type: string
 *                       example: "cbbafc43-0732-438b-9163-cd7a67dab52c"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad Request - Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid credentials.
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
  const validationResult = await validateRequestBody(request, loginSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  const { email, password } = validationResult;

  // IMPORTANT: Login needs a client that can *set* cookies.
  // The standard `createClient` from `server.ts` is read-only.
  // We need the middleware approach here, or a dedicated action client.
  // For simplicity in API routes, we often redirect to a callback handled by middleware.
  // However, since AuthService handles signIn internally and Supabase client manages cookies
  // via the middleware handlers we set up, using the standard server client might work
  // because the actual cookie setting happens in the browser or via redirects.
  // Let's try with the standard server client first, as AuthService uses signInWithPassword.
  const supabase = await createClient();
  const authService = new AuthService(supabase);

  try {
    const signInResponse = await authService.signInWithEmail({ email, password });

    if (signInResponse.error) {
      if (signInResponse.error instanceof ServiceError && 
          signInResponse.error.code === 'AUTH_INVALID_CREDENTIALS') {
        return createErrorApiResponse(signInResponse.error.message, signInResponse.error.code, 401); // Unauthorized
      }
      // Handle other potential service errors (though less likely for login)
      return createErrorApiResponse(
        signInResponse.error.message,
        signInResponse.error instanceof ServiceError ? signInResponse.error.code : 'LOGIN_FAILED',
        400 // Bad Request or use 500? 400 seems okay for general login failure
      );
    }

    // Login successful. Session cookies should have been set by Supabase client via middleware.
    return createSuccessApiResponse(
      {
        userId: signInResponse.data?.user?.id,
        // Optionally return profile data as well if needed by the frontend immediately after login
        // profile: signInResponse.data?.profile 
      },
      200 // OK
    );

  } catch (error: any) {
    console.error('[API /auth/login] Error:', error);
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred during login.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 