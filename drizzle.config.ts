import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });

// Get the database URL from environment variables
let dbUrl = process.env.DATABASE_URL;

// Fallback for local development if DATABASE_URL is not set
if (!dbUrl) {
  dbUrl = `postgres://${process.env.USER || 'golfergeek'}@localhost:5432/golfcompete`;
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