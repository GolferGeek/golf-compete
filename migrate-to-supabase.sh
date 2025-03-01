#!/bin/bash

# This script runs migrations on your Supabase database

# Exit on error
set -e

echo "Starting Supabase migration..."

# Load environment variables from .env.supabase
# Using set -a to automatically export all variables
set -a
source .env.supabase
set +a

# Print the environment variables for verification
echo "Using the following environment variables:"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "Local development database: $(grep DATABASE_URL .env.local | cut -d '=' -f2- 2>/dev/null || echo 'Not found')"

# Create a temporary .env.migration file to ensure correct environment variables are used
echo "Creating temporary migration environment file..."
cat > .env.migration << EOF
# Using direct connection URL for migrations
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
USE_SUPABASE=true
DEBUG_DB=true
EOF

# Test the database connection
echo "Testing database connection..."
if command -v pg_isready > /dev/null; then
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  echo "Checking connection to $DB_HOST:$DB_PORT..."
  pg_isready -h $DB_HOST -p $DB_PORT
  
  if [ $? -ne 0 ]; then
    echo "Cannot connect to database. Please check your connection settings."
    exit 1
  fi
else
  echo "pg_isready not found, skipping connection test."
fi

# Run the migrations
echo "Running migrations on Supabase database..."
yarn tsx src/db/migrate.ts

# If migrations fail, suggest using the SQL file directly
if [ $? -ne 0 ]; then
  echo "Migration failed. You may need to run the SQL directly in the Supabase SQL Editor."
  echo "A combined SQL file has been created at supabase-migration.sql"
  echo "Please copy the contents of this file and run it in the Supabase SQL Editor."
  exit 1
fi

# Clean up temporary file
rm .env.migration

# Reset environment variables
unset DATABASE_URL
unset NODE_ENV
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset USE_SUPABASE
unset DEBUG_DB

echo "Migration complete!" 