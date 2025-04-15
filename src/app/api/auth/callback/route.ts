import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Handles the callback from Supabase Auth (e.g., after OAuth login, email confirmation)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // IMPORTANT: Need a client that can handle cookie setting for code exchange.
    // The standard server client is read-only. Using the middleware approach
    // means the exchange happens correctly when Supabase client is created
    // within the middleware context or request context. Here we use the request context.
    const supabase = await createClient();
    
    try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            console.log('[API /auth/callback] Code exchange successful, redirecting to:', next);
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error('[API /auth/callback] Code exchange error:', error.message);
    } catch (error: any) {
        console.error('[API /auth/callback] Unexpected error during code exchange:', error);
    }

    // Return the user to an error page on failed exchange
    // TODO: Create a dedicated auth error page?
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Return the user to an error page if "code" is not found
  console.error('[API /auth/callback] No code found in callback request.');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
} 