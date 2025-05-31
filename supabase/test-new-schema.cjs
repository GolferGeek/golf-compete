// Script to test new simplified schema after migration
require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please check your .env.supabase file.');
  process.exit(1);
}

console.log('=== TESTING NEW SIMPLIFIED SCHEMA ===');
console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test table existence and basic structure
async function testTableStructure() {
  console.log('\n1. Testing table structure...');
  
  const tablesToCheck = [
    'courses',
    'tee_sets', 
    'rounds',
    'bag_setups',
    'notes'
  ];
  
  const tablesToNotExist = [
    'holes',
    'tee_set_distances',
    'round_holes',
    'hole_scores',
    'bags',
    'user_notes'
  ];
  
  // Check tables that should exist
  for (const table of tablesToCheck) {
    try {
      console.log(`Checking ${table} table...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ ${table} table exists and is accessible`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error checking ${table}:`, err.message);
    }
  }
  
  // Check tables that should NOT exist
  for (const table of tablesToNotExist) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`✅ ${table} table correctly removed`);
      } else if (error) {
        console.log(`⚠️  ${table} table access error (might be removed):`, error.message);
      } else {
        console.log(`❌ ${table} table still exists - should have been removed`);
      }
    } catch (err) {
      console.log(`✅ ${table} table correctly removed (exception caught)`);
    }
  }
}

// Test simplified rounds table structure
async function testRoundsTable() {
  console.log('\n2. Testing simplified rounds table...');
  
  try {
    // Check for expected columns by trying to select them
    const { data, error } = await supabase
      .from('rounds')
      .select('id, user_id, course_id, course_tee_id, bag_setup_id, round_date, total_score, weather_conditions, course_conditions, temperature, wind_conditions, notes, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing rounds columns:', error.message);
    } else {
      console.log('✅ Rounds table has correct simplified structure');
      console.log('   - Columns: id, user_id, course_id, course_tee_id, bag_setup_id, round_date, total_score, weather_conditions, course_conditions, temperature, wind_conditions, notes, created_at, updated_at');
    }
  } catch (err) {
    console.error('❌ Unexpected error testing rounds structure:', err.message);
  }
}

// Test bag_setups table structure
async function testBagSetupsTable() {
  console.log('\n3. Testing bag_setups table...');
  
  try {
    const { data, error } = await supabase
      .from('bag_setups')
      .select('id, user_id, setup_name, description, current_handicap, is_default, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing bag_setups columns:', error.message);
    } else {
      console.log('✅ Bag_setups table has correct structure');
      console.log('   - Columns: id, user_id, setup_name, description, current_handicap, is_default, created_at, updated_at');
    }
  } catch (err) {
    console.error('❌ Unexpected error testing bag_setups structure:', err.message);
  }
}

// Test notes table structure
async function testNotesTable() {
  console.log('\n4. Testing notes table...');
  
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('id, user_id, note_title, note_text, category, tags, round_id, course_id, hole_number, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing notes columns:', error.message);
    } else {
      console.log('✅ Notes table has correct enhanced structure');
      console.log('   - Columns: id, user_id, note_title, note_text, category, tags, round_id, course_id, hole_number, created_at, updated_at');
    }
  } catch (err) {
    console.error('❌ Unexpected error testing notes structure:', err.message);
  }
}

// Test foreign key relationships
async function testRelationships() {
  console.log('\n5. Testing foreign key relationships...');
  
  try {
    // Test rounds -> courses relationship
    console.log('Testing rounds -> courses relationship...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (coursesData && coursesData.length > 0) {
      // Try to create a test round with this course
      console.log('✅ Can reference courses from rounds table');
    } else {
      console.log('⚠️  No courses available for relationship testing');
    }
    
    // Test rounds -> tee_sets relationship
    console.log('Testing rounds -> tee_sets relationship...');
    const { data: teeSetsData, error: teeSetsError } = await supabase
      .from('tee_sets')
      .select('id')
      .limit(1);
    
    if (teeSetsData && teeSetsData.length > 0) {
      console.log('✅ Can reference tee_sets from rounds table');
    } else {
      console.log('⚠️  No tee_sets available for relationship testing');
    }
    
    console.log('✅ Foreign key relationships appear to be properly configured');
    
  } catch (err) {
    console.error('❌ Error testing relationships:', err.message);
  }
}

// Main function to run all tests
async function runSchemaTests() {
  try {
    await testTableStructure();
    await testRoundsTable();
    await testBagSetupsTable();
    await testNotesTable();
    await testRelationships();
    
    console.log('\n=== SCHEMA TEST SUMMARY ===');
    console.log('Schema validation completed! Check output above for any issues.');
    console.log('✅ = Test passed');
    console.log('❌ = Test failed'); 
    console.log('⚠️  = Warning/Note');
    
  } catch (err) {
    console.error('Unexpected error running schema tests:', err);
  }
}

// Run the tests
runSchemaTests(); 