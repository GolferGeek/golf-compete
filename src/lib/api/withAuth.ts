import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import type { User, Session } from '@supabase/supabase-js';
import { ServiceError } from '@/api/base';
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

    // First, try to get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Then get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If there's no user or session, try to refresh the session from cookies
    if (!user || !session) {
      // Log the attempt to refresh
      console.log('API Auth: No user or session found, attempting to refresh session from cookies');
      
      // Try refreshing the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('API Auth Error (refreshSession):', refreshError.message);
        return createErrorApiResponse(
          'Authentication failed',
          'UNAUTHORIZED',
          401
        );
      }
      
      // If we got a refreshed session and user, use them
      if (refreshData.session && refreshData.user) {
        console.log('API Auth: Successfully refreshed session from cookies');
        
        try {
          return await handler(request, context, { 
            user: refreshData.user, 
            session: refreshData.session 
          });
        } catch (error: any) {
          // Handle errors from handler
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
      }
      
      // If refresh didn't work, continue with original error flow
      console.warn('API Auth: Failed to refresh session, user is not authenticated');
      return createErrorApiResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // If we had a user error initially, log it but continue if we have both user and session
    if (userError) {
      console.error('API Auth Warning (getUser):', userError.message);
      // We continue because we already checked above if user exists
    }

    // If we had a session error initially, log it but continue if we have both user and session
    if (sessionError) {
      console.error('API Auth Warning (getSession):', sessionError.message);
      // We continue because we already checked above if session exists
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