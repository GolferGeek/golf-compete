import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase'; // Assuming your generated types are here

/**
 * Creates a Supabase client suitable for client components (browser).
 */
export function createClient() {
  // Note: Using process.env directly in the browser is generally okay for public keys.
  // If server-only secrets were needed, they'd have to be fetched via an API route.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} 