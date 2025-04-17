import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase'; // Assuming your generated types are here

// Creates a Supabase client for Server Components/Route Handlers (Read Only Cookies)
export async function createClient() {
  const cookieStore = await cookies();

  // Log the variables being used
  console.log('Attempting to create Supabase client with:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          try {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          } catch (error) {
            console.error('Error getting cookies:', error);
            return [];
          }
        },
        setAll: (cookies) => {
          try {
            cookies.forEach((cookie) => {
              cookieStore.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options
              });
            });
          } catch (error) {
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );
}

// Creates a Supabase client with cookie writing capability for Route Handlers that need to set cookies
// This is necessary for routes like auth callback that need to set session cookies
export async function createWritableClient(request?: NextRequest, response?: NextResponse) {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          try {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          } catch (error) {
            console.error('Error getting cookies:', error);
            return [];
          }
        },
        setAll: (cookies) => {
          try {
            cookies.forEach((cookie) => {
              cookieStore.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options
              });
              
              // If we have a response object, also set cookies there
              // This is important for the redirect response in auth callbacks
              if (response) {
                response.cookies.set({
                  name: cookie.name,
                  value: cookie.value,
                  ...cookie.options
                });
              }
            });
          } catch (error) {
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );
}

// NOTE: The createActionClient function is removed as cookie mutations
// should ideally be handled by middleware or specific response manipulation
// in POST/PUT/DELETE handlers, not a generic server client. 