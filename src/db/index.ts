import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });

// Print environment variables for debugging
console.log('Environment variables loaded:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

let connectionString: string;

if (!process.env.DATABASE_URL) {
  // Fallback for local development if DATABASE_URL is not set
  connectionString = `postgres://${process.env.USER || 'golfergeek'}@localhost:5432/golfcompete`;
  console.log('Using fallback local database:', connectionString);
} else {
  // Use the provided DATABASE_URL for both development and production
  connectionString = process.env.DATABASE_URL;
  console.log(`Using ${isDevelopment ? 'development' : 'production'} database:`, connectionString);
}

// Create a PostgreSQL client with appropriate options
const clientOptions = {
  prepare: false,
};

// Create a PostgreSQL client
const client = postgres(connectionString, clientOptions);

// Create a Drizzle ORM instance
export const db = drizzle(client, { schema }); 