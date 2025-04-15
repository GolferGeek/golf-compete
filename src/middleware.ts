import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase'; // Ensure this path is correct

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // Refresh session if expired - important!
  // This will also update the cookies in the response via the set/remove handlers above
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Centralized logging for session status
  if (sessionError) {
    console.error('Middleware: Error refreshing session:', sessionError.message);
    // Potentially handle specific errors differently, but for now, treat as no session
  }
  
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isProtectedRoute = isAdminRoute || (isApiRoute && !request.nextUrl.pathname.startsWith('/api/auth/')); // Protect /api/** except /api/auth/**

  // Handle protected routes (Admin UI and API routes)
  if (isProtectedRoute) {
    if (!session) {
      console.log(`Middleware: No session found for protected route (${request.nextUrl.pathname}), redirecting/blocking.`);
      if (isApiRoute) {
        // For API routes, return 401 Unauthorized
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      } else {
        // For UI routes (like /admin), redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // If it's an admin route, perform the admin check
    if (isAdminRoute) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Middleware: Error fetching admin profile:', profileError);
          if (isApiRoute) {
            // Handle API error for admin check failure
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          } else {
            // Redirect non-API admin check failure
            return NextResponse.redirect(new URL('/', request.url)); 
          }
        }

        // If not an admin, block/redirect
        if (!profileData?.is_admin) {
          console.log('Middleware: User is not admin, blocking/redirecting from admin route.');
          if (isApiRoute) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          } else {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
        
        console.log('Middleware: Admin user verified for admin route.');
        // User is admin, allow access
      } catch (error) {
        console.error('Middleware: Unexpected error during admin check:', error);
        if (isApiRoute) {
          return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        } else {
          return NextResponse.redirect(new URL('/', request.url)); 
        }
      }
    }
    // If it's a protected API route (but not admin), session existence is sufficient for now
    // Specific role/permission checks can happen within the route handler using AuthService/DatabaseService
  }

  // Return the response (potentially with updated session cookies)
  return response;
}

// Configure the middleware to run for specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).)*',
    // Re-include /admin explicitly if needed, though the above pattern should cover it
    // '/admin/:path*', 
  ],
};
