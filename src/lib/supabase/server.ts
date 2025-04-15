import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            console.error(`Error getting cookie '${name}':`, error);
            return undefined;
          }
        },
        // 'set' and 'remove' are omitted - handled by middleware
      },
    }
  );
}

// NOTE: The createActionClient function is removed as cookie mutations
// should ideally be handled by middleware or specific response manipulation
// in POST/PUT/DELETE handlers, not a generic server client. 