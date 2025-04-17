import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import AuthService from '@/services/internal/AuthService';

// Helper to ensure we use the correct origin
const getSafeOrigin = (requestOrigin: string) => {
  // Use configured site URL if available
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (configuredSiteUrl) {
    console.log('[API /auth/callback] Using configured site URL:', configuredSiteUrl);
    return configuredSiteUrl.endsWith('/') ? configuredSiteUrl.slice(0, -1) : configuredSiteUrl;
  }
  
  // Otherwise use the request origin
  return requestOrigin;
};

// Handles the callback from Supabase Auth (e.g., after OAuth login, email confirmation)
export async function GET(request: NextRequest) {
  console.log('[API /auth/callback] Starting OAuth callback handling');
  
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';
  
  console.log('[API /auth/callback] Callback parameters:', { 
    hasCode: !!code, 
    next,
    origin
  });
  
  // Get the safe origin to use for redirects
  const safeOrigin = getSafeOrigin(origin);
  console.log('[API /auth/callback] Using origin for redirects:', safeOrigin);
  
  if (!code) {
    // Return the user to an error page if "code" is not found
    console.error('[API /auth/callback] No code found in callback request.');
    return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`);
  }

  try {
    // Create Supabase client and AuthService
    console.log('[API /auth/callback] Creating Supabase client');
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    
    // Exchange the code for a session
    console.log('[API /auth/callback] Exchanging code for session');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[API /auth/callback] Code exchange error:', error.message);
      return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`);
    }
    
    // Verify the user is authenticated securely
    console.log('[API /auth/callback] Verifying user authentication');
    const userResponse = await authService.getCurrentUser();
    
    if (userResponse.error || !userResponse.data) {
      console.error('[API /auth/callback] User verification error:', userResponse.error);
      return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`);
    }
    
    // Now get the session after verifying the user
    console.log('[API /auth/callback] Getting session for verified user');
    const sessionResponse = await authService.getSession();
    
    if (sessionResponse.error || !sessionResponse.data?.session) {
      console.error('[API /auth/callback] Session retrieval error:', sessionResponse.error);
      return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`);
    }
    
    console.log('[API /auth/callback] Authentication successful, redirecting to:', next);
    
    // Redirect to the next URL - cookie setting happens automatically
    return NextResponse.redirect(`${safeOrigin}${next}`);
  } catch (error: any) {
    console.error('[API /auth/callback] Unexpected error during authentication:', error);
    return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`);
  }
} 