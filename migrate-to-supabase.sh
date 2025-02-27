#!/bin/bash

# This script runs migrations on your Supabase database
# You need to replace [YOUR-PASSWORD] with your actual Supabase database password

# Set the Supabase database URL
export DATABASE_URL="postgres://postgres:yzc7GFM_ukz3rpu9ugh@db.nwkuddqbizjpjjznixey.supabase.co:5432/postgres"

# Set the environment to production
export NODE_ENV="production"

# Run the migrations
echo "Running migrations on Supabase database..."
npm run db:migrate

# Reset environment variables
unset DATABASE_URL
unset NODE_ENV

echo "Migration complete!" 