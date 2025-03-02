import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the user's session from the request cookie
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    });
    
    // Get the session from the request cookie
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, allow the request to continue
    // The client-side code will handle authentication
    if (!session) {
      return NextResponse.next();
    }
    
    // Check if the user is an admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    // If not an admin, redirect to home page
    if (!profileData?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Continue with the request
    return NextResponse.next();
  }
  
  // For non-admin pages, continue with the request
  return NextResponse.next();
}

// Configure the middleware to run only for admin pages
export const config = {
  matcher: '/admin/:path*',
};
