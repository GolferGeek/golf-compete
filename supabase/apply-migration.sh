#!/bin/bash

# Exit on error
set -e

echo "Applying migration to Supabase..."

# Load environment variables
source .env.local

# Check if required environment variables are set
if [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_DB_HOST" ] || [ -z "$SUPABASE_DB_NAME" ]; then
    echo "Error: Required environment variables are not set"
    echo "Please ensure SUPABASE_DB_PASSWORD, SUPABASE_DB_HOST, and SUPABASE_DB_NAME are set in .env.local"
    exit 1
fi

# Run the migration
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgres://postgres.$SUPABASE_DB_NAME:$SUPABASE_DB_PASSWORD@$SUPABASE_DB_HOST/postgres" -f supabase/migrations/20240613000000_update_series_participants_rls.sql

echo "Migration applied successfully!" 