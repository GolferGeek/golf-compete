import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase'; // Ensure this path is correct

// List of valid/known routes in the app
const VALID_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/dashboard',
  '/profile',
  '/onboarding',
  '/competitions',
  '/tracking',
  '/improvement',
  '/coaching',
  '/courses',
  '/games',
  '/privacy',
  '/terms',
];

// Routes with prefixes (paths that start with these are valid)
const VALID_PREFIXES = [
  '/auth/',
  '/api/',
  '/profile/',
  '/admin/',
  '/dashboard/',
  '/competitions/',
  '/events/'
];

// Static assets prefixes to ignore
const STATIC_ASSET_PREFIXES = [
  '/_next/',
  '/favicon.ico',
  '/assets/',
  '/images/',
];

export async function middleware(request: NextRequest) {
  // Check if the route is a static asset - if so, skip all checks
  const pathName = request.nextUrl.pathname;
  if (STATIC_ASSET_PREFIXES.some(prefix => pathName.startsWith(prefix))) {
    return NextResponse.next();
  }
  
  // Check if the route is valid
  const isValidRoute = 
    VALID_ROUTES.includes(pathName) || 
    VALID_PREFIXES.some(prefix => pathName.startsWith(prefix));
  
  // If it's not a valid route, redirect to the home page
  if (!isValidRoute) {
    console.log(`Middleware: Invalid route detected (${pathName}), redirecting to home page`);
    return NextResponse.redirect(new URL('/', request.url));
  }

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
        getAll: () => {
          return request.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: (cookies) => {
          cookies.forEach(({ name, value, ...options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // Refresh session if expired - important!
  // This will also update the cookies in the response via the set/remove handlers above
  
  // First, authenticate the user securely
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    // Only log as error if it's not a "missing session" error, which is expected for anonymous users
    if (userError.message.includes('missing') || userError.message.includes('session')) {
      console.log('Middleware: No auth session - anonymous user');
    } else {
      console.error('Middleware: Error authenticating user:', userError.message);
    }
    // Continue with no user authenticated
  }
  
  // Then get the session, which we need for cookies/refresh
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Centralized logging for session status
  if (sessionError) {
    // Only log as error if it's not a "missing session" error, which is expected for anonymous users
    if (sessionError.message.includes('missing') || sessionError.message.includes('session')) {
      console.log('Middleware: No session found - anonymous user');
    } else {
      console.error('Middleware: Error refreshing session:', sessionError.message);
    }
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
        return NextResponse.redirect(new URL('/auth/login', request.url));
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
