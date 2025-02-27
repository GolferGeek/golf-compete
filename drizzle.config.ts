import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV !== 'production';

// Set the database URL based on environment
const dbUrl = isDevelopment
  ? process.env.DATABASE_URL || `postgres://${process.env.USER || 'golfergeek'}@localhost:5432/golfcompete`
  : process.env.SUPABASE_URL;

if (!dbUrl) {
  throw new Error('Database URL is not set');
}

console.log('Drizzle config using database URL:', dbUrl);

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config; 