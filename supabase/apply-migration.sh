#!/bin/bash

# Exit on error
set -e

echo "Applying migration to Supabase..."

# Load environment variables
source .env.local

# Run the migration
PGPASSWORD="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a3VkZHFiaXpqcGpqem5peGV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDQ4NzcyMywiZXhwIjoyMDU2MDYzNzIzfQ.hapCQRgat5T_L3DYvhl7gAju4Xg5NnQioJW1A4Y1dUM" psql "postgres://postgres.nwkuddqbizjpjjznixey:ggsupabase01@aws-0-us-east-2.pooler.supabase.com:6543/postgres" -f supabase/migrations/20240613000000_update_series_participants_rls.sql

echo "Migration applied successfully!" 