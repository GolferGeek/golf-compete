import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import AuthService from '@/api/internal/auth/AuthService';
import { createSuccessApiResponse, createErrorApiResponse } from '@/lib/api/utils';

export async function POST(request: Request) {
  try {
    console.log('[API /auth/exchange-code] Starting code exchange');
    
    const { code } = await request.json();
    console.log('[API /auth/exchange-code] Code present:', !!code);
    
    if (!code) {
      console.error('[API /auth/exchange-code] No code provided');
      return createErrorApiResponse('Missing code parameter', 'MISSING_CODE', 400);
    }
    
    // Create a Supabase client on the server
    console.log('[API /auth/exchange-code] Creating Supabase client');
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    
    // Exchange the code for a session - this happens server-side only
    console.log('[API /auth/exchange-code] Exchanging code for session');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log('[API /auth/exchange-code] Exchange result:', {
      success: !error,
      errorMessage: error?.message,
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
    });
    
    if (error) {
      console.error('[API /auth/exchange-code] Error exchanging code:', error);
      return createErrorApiResponse(
        error.message || 'Failed to exchange code for session',
        'AUTH_CODE_EXCHANGE_ERROR',
        500
      );
    }
    
    // Get fresh session data to return
    console.log('[API /auth/exchange-code] Getting session data');
    const sessionResponse = await authService.getSession();
    
    console.log('[API /auth/exchange-code] Session response:', {
      success: !sessionResponse.error,
      errorMessage: sessionResponse.error?.message,
      hasSession: !!sessionResponse.data?.session,
      hasUser: !!sessionResponse.data?.user,
    });
    
    if (sessionResponse.error) {
      console.error('[API /auth/exchange-code] Error getting session after exchange:', sessionResponse.error);
      return createErrorApiResponse(
        sessionResponse.error.message || 'Failed to get session after code exchange',
        'AUTH_SESSION_ERROR',
        500
      );
    }
    
    // Create a response with session information
    // We use NextResponse.json directly to ensure cookies are properly set
    console.log('[API /auth/exchange-code] Creating success response');
    const responseData = {
      status: 'success',
      data: {
        session: data.session,
        user: data.user
      },
      timestamp: new Date().toISOString()
    };
    
    // Using NextResponse directly preserves cookies set by Supabase
    console.log('[API /auth/exchange-code] Returning response with session data');
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[API /auth/exchange-code] Unexpected error:', error);
    return createErrorApiResponse(
      error.message || 'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
} 