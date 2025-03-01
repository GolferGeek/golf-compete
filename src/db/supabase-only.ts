/**
 * This file replaces the previous database module with a Supabase-only approach.
 * All database operations should use the Supabase client directly.
 */

import { supabase } from '@/lib/supabase';

// Export the Supabase client for database operations
export { supabase };

// Export a message indicating that we're using Supabase only
export const DB_TYPE = 'supabase-cloud';

console.log('Using Supabase cloud instance for all database operations'); 