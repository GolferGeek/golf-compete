// Script to run migration via Supabase REST API
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Execute SQL via REST API
async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return await response.json();
}

async function runMigration() {
  console.log('🚀 Running database migration...');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250601000000_simplify_golf_app_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    console.log('📍 Size:', migrationSQL.length, 'characters');
    
    // Execute the entire migration
    const result = await executeSQL(migrationSQL);
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', result);
    
    // Validate the result
    console.log('\n🔍 Validating migration...');
    await validateMigration();
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 You can also run the migration manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nwkuddqbizjpjjznixey/sql');
    console.log('2. Copy the contents of: supabase/migrations/20250601000000_simplify_golf_app_schema.sql');
    console.log('3. Paste and execute in the SQL Editor');
  }
}

async function validateMigration() {
  // Test new tables exist
  const testQueries = [
    'SELECT 1 FROM bag_setups LIMIT 1',
    'SELECT 1 FROM notes LIMIT 1', 
    'SELECT 1 FROM rounds LIMIT 1'
  ];
  
  for (const query of testQueries) {
    try {
      await executeSQL(query);
      console.log(`✅ ${query.split(' ')[3]} table accessible`);
    } catch (err) {
      console.log(`❌ ${query.split(' ')[3]} table check failed: ${err.message}`);
    }
  }
}

// Run it
runMigration(); 