import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import type { User, Session } from '@supabase/supabase-js';
import { ServiceError } from '@/services/base';
import { createErrorApiResponse } from './utils';

/**
 * Defines the shape of the authenticated context passed to the route handler.
 */
export interface AuthenticatedContext {
  user: User;
  session: Session;
}

/**
 * Defines the signature for an authenticated API route handler.
 * It receives the request, route parameters, and the authenticated context.
 */
type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: { params?: any }, // Route parameters (e.g., { params: { id: '123' } })
  auth: AuthenticatedContext // Injected authentication data
) => Promise<Response>; // Use standard Response object

/**
 * Higher-order function to wrap Next.js API route handlers (App Router style)
 * ensuring the user is authenticated before proceeding.
 *
 * @param handler The authenticated route handler function.
 * @returns A new route handler that performs authentication checks.
 */
export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (
    request: NextRequest,
    context: { params?: any }
  ): Promise<Response> => {
    const supabase = await createClient();

    // First, validate user authentication securely
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('API Auth Error (getUser):', userError.message);
      return createErrorApiResponse(
        'Authentication failed',
        'UNAUTHORIZED',
        401
      );
    }

    // User doesn't exist (not authenticated)
    if (!user) {
      console.warn('API Auth: No authenticated user found.');
      return createErrorApiResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Get session data for cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('API Auth Error (getSession):', sessionError.message);
      return createErrorApiResponse(
        'Internal Server Error during authentication.',
        'AUTH_ERROR',
        500
      );
    }

    if (!session) {
      console.warn('API Auth: No active session found.');
      return createErrorApiResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    try {
      return await handler(request, context, { user, session });
    } catch (error: any) {
      console.error('API Route Handler Error:', error);
      
      if (error instanceof ServiceError) {
        let statusCode = 500;
        if (error.code.startsWith('auth/') || error.code === 'UNAUTHORIZED') statusCode = 401;
        if (error.code.includes('not-found') || error.code === 'DB_NOT_FOUND') statusCode = 404;
        if (error.code.includes('constraint') || error.code === 'DB_CONSTRAINT_VIOLATION') statusCode = 400;
        if (error.code === 'VALIDATION_ERROR') statusCode = 400;

        return createErrorApiResponse(error.message, error.code, statusCode);
      }
      
      return createErrorApiResponse(
        error.message || 'Internal Server Error',
        'INTERNAL_SERVER_ERROR',
        500
      );
    }
  };
} 