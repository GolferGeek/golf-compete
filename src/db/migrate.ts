import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';

// Load environment variables from all relevant files
// Order matters: .env.local overrides .env
config({ path: '.env' });
config({ path: '.env.local', override: true });

// Print environment variables for debugging
console.log('Environment variables loaded for migration:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Import db after environment variables are loaded
import { db } from './index';

// This will run migrations on the database, creating tables if they don't exist
// and updating them if they do
console.log('Running migrations...');

async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (err: unknown) {
    console.error('Migrations failed', err);
    process.exit(1);
  }
}

runMigrations(); 