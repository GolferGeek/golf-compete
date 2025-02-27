// Script to check Supabase connection
require('dotenv').config({ path: '.env.supabase' });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const { Client } = require('pg');

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('Environment variables:');
console.log('- SUPABASE_URL:', supabaseUrl);
console.log('- SUPABASE_API_KEY:', supabaseKey ? '✓ Set (hidden for security)' : '✗ Missing');
console.log('- DATABASE_URL:', databaseUrl ? '✓ Set (hidden for security)' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please check your .env.supabase file.');
  process.exit(1);
}

// 1. Test REST API connectivity
console.log('\n1. Testing REST API connectivity...');
function testRestApi() {
  return new Promise((resolve) => {
    const url = `${supabaseUrl}/rest/v1/`;
    console.log(`Making HTTP request to: ${url}`);
    
    const options = {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status code: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);
        console.log(`Response body: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.error('HTTP request error:', err.message);
      resolve(false);
    });
  });
}

// 2. Test Supabase client
console.log('\n2. Testing Supabase client...');
async function testSupabaseClient() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Attempting to query the users table...');
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Error querying users table:', error.message);
      return false;
    }
    
    console.log('Successfully queried users table!');
    console.log('Data:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error with Supabase client:', err);
    return false;
  }
}

// 3. Test direct PostgreSQL connection
console.log('\n3. Testing direct PostgreSQL connection...');
async function testDirectPgConnection() {
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL. Cannot test direct PostgreSQL connection.');
    return false;
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    console.log('Querying database version...');
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    
    console.log('Listing tables in public schema...');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in public schema:');
    if (tablesRes.rows.length === 0) {
      console.log('No tables found in public schema');
    } else {
      tablesRes.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    await client.end();
    return true;
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    try {
      await client.end();
    } catch (e) {
      // Ignore error on closing
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== SUPABASE CONNECTION DIAGNOSTICS ===');
  
  const restApiSuccess = await testRestApi();
  console.log(`\nREST API Test: ${restApiSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  const clientSuccess = await testSupabaseClient();
  console.log(`\nSupabase Client Test: ${clientSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  const pgSuccess = await testDirectPgConnection();
  console.log(`\nDirect PostgreSQL Test: ${pgSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n=== DIAGNOSTICS SUMMARY ===');
  if (restApiSuccess && clientSuccess && pgSuccess) {
    console.log('✅ All tests passed! Your Supabase connection is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the detailed output above.');
    
    if (!restApiSuccess) {
      console.log('\nREST API troubleshooting:');
      console.log('- Verify your SUPABASE_URL is correct');
      console.log('- Verify your SUPABASE_API_KEY is correct');
      console.log('- Check if your network allows connections to Supabase');
    }
    
    if (!clientSuccess) {
      console.log('\nSupabase client troubleshooting:');
      console.log('- Verify your database has the expected tables');
      console.log('- Check if your API key has the necessary permissions');
    }
    
    if (!pgSuccess) {
      console.log('\nPostgreSQL connection troubleshooting:');
      console.log('- Verify your DATABASE_URL is in the correct format');
      console.log('- Check if your database password is correct');
      console.log('- Ensure your IP is allowed in Supabase database settings');
      console.log('- Try using the connection pooler URL instead of direct connection');
    }
  }
}

runTests(); 