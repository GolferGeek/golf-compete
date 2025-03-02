/**
 * Database module - exports the Supabase client for database operations
 * This file now simply re-exports from supabase-only.ts
 */

import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });
// Check for Supabase-specific environment file
config({ path: '.env.supabase', override: true });

// Re-export everything from supabase-only
export * from './supabase-only';

console.log('Using Supabase for all database operations');