import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import AuthService from '@/api/internal/auth/AuthService';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log('[API /auth/google] Starting Google OAuth flow');
    
    // Create AuthService
    const supabase = await createClient();
    const authService = new AuthService(supabase);
    
    // Use the current request origin for the callback
    const callbackUrl = `${request.nextUrl.origin}/api/auth/callback`;
    console.log(`[API /auth/google] Using callback URL: ${callbackUrl}`);
    
    // Generate OAuth URL directly
    const { data, error } = await authService.signInWithOAuth({
      provider: 'google',
      redirectTo: callbackUrl,
      scopes: 'email profile'
    });
    
    if (error || !data?.url) {
      console.error(`[API /auth/google] Error generating OAuth URL:`, error);
      return new Response(
        JSON.stringify({ error: error?.message || 'Failed to generate OAuth URL' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[API /auth/google] Generated URL: ${data.url}`);
    
    // Use 303 redirect for after a GET request
    return new Response(null, {
      status: 303,
      headers: {
        'Location': data.url
      }
    });
  } catch (error: any) {
    console.error(`[API /auth/google] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 