import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/events/',
  '/series/'
];

// Static assets prefixes to ignore
const STATIC_ASSET_PREFIXES = [
  '/_next/',
  '/favicon.ico',
  '/assets/',
  '/images/',
];

// Routes that should not redirect to login even if user is not authenticated
const UNPROTECTED_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/callback',
  '/api/auth/',
  '/api/courses/'
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

  // Protect against redirect loops
  const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0');
  const hasAttemptedRefresh = request.cookies.has('attempted_refresh');
  const isRefreshing = request.cookies.has('is_refreshing');
  
  // Detect potential redirect loops
  if (redirectCount > 2 || (pathName === '/auth/login' && hasAttemptedRefresh)) {
    console.log(`Middleware: Potential redirect loop detected for ${pathName}`);
    // Break the loop by allowing the request to proceed
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Set a header to track redirects
  response.headers.set('x-redirect-count', (redirectCount + 1).toString());
  
  const supabase = createServerClient(
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

  // First, get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // If no session and not already refreshing, try to refresh
  if (!session && !isRefreshing) {
    console.log('Middleware: No active session found, attempting to refresh');
    
    try {
      // Set a cookie to indicate we're attempting a refresh
      response.cookies.set('is_refreshing', 'true', { 
        maxAge: 10, // Short-lived - 10 seconds 
        path: '/' 
      });
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      // Clear the refresh indicator
      response.cookies.set('is_refreshing', '', { 
        maxAge: 0, 
        path: '/' 
      });
      
      if (refreshError) {
        console.log('Middleware: Session refresh failed:', refreshError.message);
        // Set a cookie to note that we tried to refresh (to prevent loops)
        response.cookies.set('attempted_refresh', 'true', { 
          maxAge: 60, // 1 minute 
          path: '/' 
        });
      } else if (refreshData.session) {
        console.log('Middleware: Successfully refreshed session');
        // We now have a valid session from the refresh
      }
    } catch (refreshErr) {
      console.error('Middleware: Unexpected error refreshing session:', refreshErr);
      // Clear the refresh indicator
      response.cookies.set('is_refreshing', '', { 
        maxAge: 0, 
        path: '/' 
      });
    }
  }

  // Check if the current route is unprotected
  const isUnprotected = UNPROTECTED_ROUTES.some(route => 
    route === pathName || 
    (route.endsWith('/') && pathName.startsWith(route))
  );
  
  // If it's an unprotected route, don't check for authentication
  if (isUnprotected) {
    return response;
  }
  
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isProtectedRoute = isAdminRoute || (
    isApiRoute && 
    !request.nextUrl.pathname.startsWith('/api/auth/') && 
    !request.nextUrl.pathname.startsWith('/api/courses/') // Allow public access to courses data
  );

  // Handle protected routes (Admin UI and API routes)
  if (isProtectedRoute) {
    // Try one more time to get the session after our refresh attempt
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      console.log(`Middleware: No session found for protected route (${request.nextUrl.pathname}), redirecting/blocking.`);
      if (isApiRoute) {
        // For API routes, return 401 Unauthorized
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      } else {
        // For UI routes (like /admin), redirect to login with the return URL
        const returnUrl = encodeURIComponent(request.nextUrl.pathname);
        return NextResponse.redirect(new URL(`/auth/login?redirect=${returnUrl}`, request.url));
      }
    }
    
    // If it's an admin route, perform the admin check
    if (isAdminRoute) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentSession.user.id)
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
