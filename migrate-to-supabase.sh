#!/bin/bash

# This script runs migrations on your Supabase database

# Set the Supabase database URL - using the pooler connection string in session mode
# This works better with IPv4 networks and avoids ENOTFOUND errors
export DATABASE_URL="postgres://postgres.nwkuddqbizjpjjznixey:yzc7GFM_ukz3rpu9ugh@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Set the environment to production
export NODE_ENV="production"

# Print the environment variables for verification
echo "Using the following environment variables:"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"

# Create a temporary .env.migration file
echo "Creating temporary .env.migration file..."
cat > .env.migration << EOL
DATABASE_URL=${DATABASE_URL}
NODE_ENV=${NODE_ENV}
EOL

# Run the migrations with the temporary environment file
echo "Running migrations on Supabase database..."
NODE_ENV=production DATABASE_URL="$DATABASE_URL" npx tsx src/db/migrate.ts

# Clean up
echo "Cleaning up..."
rm .env.migration

# Reset environment variables
unset DATABASE_URL
unset NODE_ENV

echo "Migration complete!" 