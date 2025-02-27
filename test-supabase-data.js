// Script to test data operations with Supabase
require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please check your .env.supabase file.');
  process.exit(1);
}

console.log('=== TESTING SUPABASE DATA OPERATIONS ===');
console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to interact with the users table
async function testUsersTable() {
  console.log('\n1. Testing users table...');
  
  try {
    // First, check if we can read from the users table
    console.log('Attempting to read from users table...');
    const { data: readData, error: readError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('Error reading from users table:', readError.message);
    } else {
      console.log('Successfully read from users table!');
      console.log(`Found ${readData.length} users:`);
      readData.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.name || 'No name'} (${user.email || 'No email'})`);
      });
    }
    
    // Now, try to insert a test user (if table is empty)
    if (!readError && readData.length === 0) {
      console.log('\nAttempting to insert a test user...');
      
      const testUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        member_since: new Date().toISOString(),
        password: 'password123' // In a real app, this would be hashed
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(testUser)
        .select();
      
      if (insertError) {
        console.error('Error inserting test user:', insertError.message);
      } else {
        console.log('Successfully inserted test user!');
        console.log('New user:', insertData[0]);
        
        // Clean up by deleting the test user
        console.log('\nCleaning up - deleting test user...');
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('Error deleting test user:', deleteError.message);
        } else {
          console.log('Successfully deleted test user!');
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error testing users table:', err);
  }
}

// Test function to interact with the courses table
async function testCoursesTable() {
  console.log('\n2. Testing courses table...');
  
  try {
    // Check if we can read from the courses table
    console.log('Attempting to read from courses table...');
    const { data: readData, error: readError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('Error reading from courses table:', readError.message);
    } else {
      console.log('Successfully read from courses table!');
      console.log(`Found ${readData.length} courses:`);
      readData.forEach((course, index) => {
        console.log(`Course ${index + 1}: ${course.name || 'No name'} (${course.location || 'No location'})`);
      });
    }
    
    // Try to insert a test course (if table is empty)
    if (!readError && readData.length === 0) {
      console.log('\nAttempting to insert a test course...');
      
      const testCourse = {
        name: 'Test Golf Course',
        location: 'Test Location',
        holes: 18,
        par: 72,
        rating: 72.5,
        slope: 125,
        amenities: 'Driving Range, Pro Shop',
        website: 'https://example.com',
        phone_number: '555-123-4567'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('courses')
        .insert(testCourse)
        .select();
      
      if (insertError) {
        console.error('Error inserting test course:', insertError.message);
      } else {
        console.log('Successfully inserted test course!');
        console.log('New course:', insertData[0]);
        
        // Clean up by deleting the test course
        console.log('\nCleaning up - deleting test course...');
        const { error: deleteError } = await supabase
          .from('courses')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('Error deleting test course:', deleteError.message);
        } else {
          console.log('Successfully deleted test course!');
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error testing courses table:', err);
  }
}

// Main function to run all tests
async function runTests() {
  try {
    // Test the users table
    await testUsersTable();
    
    // Test the courses table
    await testCoursesTable();
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('Tests completed. Check the output above for details on any errors.');
    console.log('If all tests passed, your Supabase database is working correctly!');
    console.log('If you encountered errors, you may need to check your table schemas or permissions.');
  } catch (err) {
    console.error('Unexpected error running tests:', err);
  }
}

// Run the tests
runTests(); 