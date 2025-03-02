#!/bin/bash

# This script runs migrations on your Supabase database using the Supabase CLI

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

# Run the migrations using Supabase CLI
echo "Running migrations on Supabase database..."
if command -v npx > /dev/null; then
  npx supabase migration up
else
  echo "npx not found. Please install Node.js and npm."
  exit 1
fi

# If migrations fail, suggest using the SQL file directly
if [ $? -ne 0 ]; then
  echo "Migration failed. You may need to run the SQL directly in the Supabase SQL Editor."
  echo "Please copy the contents of the migration files and run them in the Supabase SQL Editor."
  exit 1
fi

# Reset environment variables
unset DATABASE_URL
unset NODE_ENV
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset DEBUG_DB

echo "Migration complete!"