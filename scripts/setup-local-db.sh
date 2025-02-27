#!/bin/bash

# This script helps set up a local PostgreSQL database for development

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first."
    echo "You can install it using Homebrew: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL service is not running. Please start it first."
    echo "You can start it using: brew services start postgresql"
    exit 1
fi

# Get current username
CURRENT_USER=$(whoami)
echo "Using database user: $CURRENT_USER"

# Database name
DB_NAME="golfcompete"

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Creating database: $DB_NAME"
    createdb $DB_NAME
else
    echo "Database $DB_NAME already exists"
fi

# Generate migrations
echo "Generating migrations..."
npm run db:generate

# Apply migrations
echo "Applying migrations..."
npm run db:migrate

echo "Local database setup complete!"
echo "You can now run your application with: npm run dev" 