// Direct migration script using PostgreSQL connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

console.log('🚀 === DIRECT DATABASE MIGRATION ===');
console.log('📍 Target:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Execute migration in manageable chunks
async function executeDirectMigration() {
  console.log('\n📋 === STARTING MIGRATION ===');
  
  try {
    // Step 1: Create backup tables
    console.log('\n1️⃣ Creating backup tables...');
    
    const backupQueries = [
      "CREATE TABLE IF NOT EXISTS rounds_backup AS SELECT * FROM rounds;",
      "CREATE TABLE IF NOT EXISTS bags_backup AS SELECT * FROM bags;", 
      "CREATE TABLE IF NOT EXISTS user_notes_backup AS SELECT * FROM user_notes;"
    ];
    
    for (const query of backupQueries) {
      console.log(`📝 ${query.substring(0, 50)}...`);
      const { error } = await supabase.rpc('sql', { query });
      if (error) {
        console.log(`⚠️  Backup warning: ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    }
    
    // Step 2: Drop old complex tables
    console.log('\n2️⃣ Dropping complex tables...');
    
    const dropQueries = [
      "DROP TABLE IF EXISTS round_holes CASCADE;",
      "DROP TABLE IF EXISTS hole_scores CASCADE;",
      "DROP TABLE IF EXISTS tee_set_distances CASCADE;",
      "DROP TABLE IF EXISTS holes CASCADE;"
    ];
    
    for (const query of dropQueries) {
      console.log(`📝 ${query}`);
      const { error } = await supabase.rpc('sql', { query });
      if (error) {
        console.log(`⚠️  Drop warning: ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    }
    
    // Step 3: Create new simplified schema using Supabase direct table operations
    console.log('\n3️⃣ Creating new schema...');
    
    // We'll need to use the SQL editor for complex operations
    console.log('⚠️  For complex schema changes, please:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the migration SQL file');
    console.log('   3. Execute the remaining schema changes manually');
    console.log('');
    console.log('📁 Migration file location:');
    console.log('   supabase/migrations/20250601000000_simplify_golf_app_schema.sql');
    console.log('');
    console.log('🔗 Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/nwkuddqbizjpjjznixey/sql');
    
    return true;
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    return false;
  }
}

// Run migration
executeDirectMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ Partial migration completed');
      console.log('📋 Next: Complete schema changes via SQL Editor');
    } else {
      console.log('\n❌ Migration failed');
    }
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
  }); 