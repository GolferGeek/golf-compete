import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server'; // Need client for service instantiation
import AuthService from '@/api/internal/database/AuthService';
import { validateRequestBody, createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';
import { ServiceError } from '@/api/base';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().min(3, { message: 'Username must be at least 3 characters long' }).optional(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with email and password, and optionally profile details.
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
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               username:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       201:
 *         description: User registered successfully. May require email confirmation.
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
 *                     message:
 *                       type: string
 *                       example: "Registration successful. Please check your email to confirm."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad Request - Validation error (e.g., invalid email, weak password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Email already in use.
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
  // Validate request body
  const validationResult = await validateRequestBody(request, registerSchema);
  if (validationResult instanceof NextResponse) {
    return validationResult; // Return error response if validation fails
  }

  const { email, password, first_name, last_name, username } = validationResult;

  // Need a client to instantiate the service
  // IMPORTANT: Registration typically uses the ANON key, which the server client provides.
  // If a service role was needed, it would be handled within the BaseService/AuthService.
  const supabase = await createClient(); 
  const authService = new AuthService(supabase);

  try {
    const signUpResponse = await authService.signUpWithEmail({
      email,
      password,
      first_name,
      last_name,
      username,
    });

    if (signUpResponse.error) {
      if (signUpResponse.error instanceof ServiceError) {
        // Map specific service errors to HTTP statuses
        if (signUpResponse.error.code === 'AUTH_EMAIL_IN_USE') {
          return createErrorApiResponse(signUpResponse.error.message, signUpResponse.error.code, 409); // Conflict
        }
        // Add other specific mappings if needed (e.g., weak password)
        return createErrorApiResponse(signUpResponse.error.message, signUpResponse.error.code, 400); // Bad Request for most auth errors
      }
      // Fallback for non-ServiceErrors
      return createErrorApiResponse(signUpResponse.error.message, 'REGISTRATION_FAILED', 500);
    }

    // Determine appropriate success message
    let message = 'Registration successful.';
    // Supabase signUp might return user data even if confirmation is required
    // Check for specific conditions if needed (e.g., data.user?.email_confirmed_at)
    if (!signUpResponse.data?.user?.email_confirmed_at) { 
        message = 'Registration successful. Please check your email to confirm.';
    }

    return createSuccessApiResponse(
      {
        userId: signUpResponse.data?.user?.id, // Return user ID if available
        message: message,
      },
      201 // Created status code
    );

  } catch (error: any) {
    console.error('[API /auth/register] Error:', error);
    // Handle unexpected errors during service call
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred during registration.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 