// Script to check if tables exist in Supabase
require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please check your .env.supabase file.');
  process.exit(1);
}

console.log('=== CHECKING TABLES IN SUPABASE ===');
console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// List of tables we expect to exist
const expectedTables = [
  'users',
  'coaches',
  'competitions',
  'competition_participants',
  'courses',
  'drills',
  'hole_scores',
  'lessons',
  'practice_plans',
  'practice_plan_drills',
  'rounds',
  'tee_sets',
  'bags',
  'bag_clubs',
  'clubs'
];

async function checkTables() {
  try {
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .from('_tables')
      .select('name')
      .eq('schema', 'public');
    
    if (error) {
      // If _tables doesn't exist, try a different approach
      console.error('Error querying _tables:', error.message);
      console.log('Trying alternative approach...');
      return checkTablesAlternative();
    }
    
    if (!data || data.length === 0) {
      console.log('No tables found in the public schema.');
      return;
    }
    
    const existingTables = data.map(table => table.name);
    console.log('\nExisting tables in public schema:');
    existingTables.forEach(table => {
      console.log(`- ${table}`);
    });
    
    // Check which expected tables exist
    console.log('\nChecking expected tables:');
    const missingTables = [];
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table}: exists`);
      } else {
        console.log(`❌ ${table}: missing`);
        missingTables.push(table);
      }
    });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total tables found: ${existingTables.length}`);
    console.log(`Expected tables: ${expectedTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\nMissing tables:');
      missingTables.forEach(table => {
        console.log(`- ${table}`);
      });
      
      console.log('\nYou need to run migrations to create these tables.');
    } else {
      console.log('\nAll expected tables exist! Your database schema is complete.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Alternative approach if _tables doesn't exist
async function checkTablesAlternative() {
  try {
    // Try to query each table to see if it exists
    console.log('\nChecking tables individually:');
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: missing or error - ${error.message}`);
          missingTables.push(table);
        } else {
          console.log(`✅ ${table}: exists (${data.count} rows)`);
          existingTables.push(table);
        }
      } catch (err) {
        console.log(`❌ ${table}: missing or error - ${err.message}`);
        missingTables.push(table);
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total tables found: ${existingTables.length}`);
    console.log(`Expected tables: ${expectedTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\nMissing tables:');
      missingTables.forEach(table => {
        console.log(`- ${table}`);
      });
      
      console.log('\nYou need to run migrations to create these tables.');
    } else {
      console.log('\nAll expected tables exist! Your database schema is complete.');
    }
  } catch (err) {
    console.error('Unexpected error in alternative check:', err);
  }
}

// Run the check
checkTables(); 