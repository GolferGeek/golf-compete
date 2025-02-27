import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });
// Check for migration-specific environment file
config({ path: '.env.migration', override: true });
// Check for Supabase-specific environment file
config({ path: '.env.supabase', override: process.env.USE_SUPABASE === 'true' });

// Get environment variables from process.env
const {
  DATABASE_URL: envDatabaseUrl,
  NODE_ENV: envNodeEnv,
  SUPABASE_URL: envSupabaseUrl,
} = process.env;

// Print environment variables for debugging
console.log('Environment variables loaded:');
console.log('DATABASE_URL:', envDatabaseUrl);
console.log('SUPABASE_URL:', envSupabaseUrl);
console.log('NODE_ENV:', envNodeEnv);

// Determine if we're in development or production
const isDevelopment = envNodeEnv !== 'production';

let connectionString: string;

if (!envDatabaseUrl) {
  // Fallback for local development if DATABASE_URL is not set
  connectionString = `postgres://${process.env.USER || 'golfergeek'}@localhost:5432/golfcompete`;
  console.log('Using fallback local database:', connectionString);
} else {
  // Use the provided DATABASE_URL for both development and production
  connectionString = envDatabaseUrl;
  console.log(`Using ${isDevelopment ? 'development' : 'production'} database:`, connectionString);
}

// Determine if we're using Supabase
const isSupabase = connectionString.includes('supabase.co');

// Create a PostgreSQL client with appropriate options
const clientOptions = {
  prepare: isSupabase ? false : true, // Disable prepared statements for Supabase pooler compatibility
  ssl: isSupabase ? { rejectUnauthorized: false } : false, // Enable SSL for Supabase with self-signed cert support
  connection: {
    // Set a longer timeout for Supabase connections
    connectTimeout: isSupabase ? 60000 : 30000,
    application_name: 'golf-compete',
  },
  debug: process.env.DEBUG_DB === 'true',
  max: 10, // Maximum number of connections
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 60, // Connection timeout in seconds
};

let client;
let db;

try {
  // Create a PostgreSQL client
  client = postgres(connectionString, clientOptions);

  // Create a Drizzle ORM instance
  db = drizzle(client, { schema });
  
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Failed to connect to the database:', error);
  throw error;
}

// Export the database instance
export { db }; 