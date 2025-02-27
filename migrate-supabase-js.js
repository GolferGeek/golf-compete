// Script to run migrations using Supabase JavaScript client
require('dotenv').config({ path: '.env.supabase' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please check your .env.supabase file.');
  process.exit(1);
}

// Set to true to continue despite errors
process.env.CONTINUE_ON_ERROR = 'true';

console.log('=== SUPABASE MIGRATION USING JAVASCRIPT CLIENT ===');
console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration SQL file
const migrationSql = fs.readFileSync('supabase-migration.sql', 'utf8');

// Process the SQL file to extract actual SQL statements
// This is more robust than just splitting by semicolon
function extractSqlStatements(sqlContent) {
  // Remove SQL comments
  const sqlWithoutComments = sqlContent.replace(/--.*$/gm, '');
  
  // Split by semicolons and filter out empty statements
  return sqlWithoutComments
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

const statements = extractSqlStatements(migrationSql);

async function runMigrations() {
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
    console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
    
    try {
      // Execute the SQL statement using Supabase's SQL API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: statement
        })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        // If not JSON, get text
        result = await response.text();
      }
      
      if (!response.ok) {
        console.error(`Error executing statement ${i + 1}:`, typeof result === 'string' ? result : JSON.stringify(result));
        errorCount++;
        
        // Check if the error is because the object already exists
        const errorMessage = typeof result === 'string' ? result : JSON.stringify(result);
        if (errorMessage.includes('already exists')) {
          console.log('Object already exists, continuing...');
        } else {
          // For other errors, check if we should continue
          const shouldContinue = process.env.CONTINUE_ON_ERROR === 'true';
          if (!shouldContinue) {
            console.error('Migration failed. Set CONTINUE_ON_ERROR=true to continue despite errors.');
            process.exit(1);
          }
        }
      } else {
        console.log('Statement executed successfully');
        successCount++;
      }
    } catch (err) {
      console.error(`Unexpected error executing statement ${i + 1}:`, err);
      errorCount++;
      
      // Check if we should continue
      const shouldContinue = process.env.CONTINUE_ON_ERROR === 'true';
      if (!shouldContinue) {
        console.error('Migration failed. Set CONTINUE_ON_ERROR=true to continue despite errors.');
        process.exit(1);
      }
    }
  }
  
  console.log('\n=== MIGRATION SUMMARY ===');
  console.log(`Total statements: ${statements.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\nSome statements failed. Please check the output above for details.');
    if (errorCount === statements.length) {
      console.log('\nAll statements failed. This might indicate a permission issue or incorrect API endpoint.');
      console.log('Consider using the Supabase Dashboard SQL Editor to run your migrations manually.');
    }
    process.exit(1);
  } else {
    console.log('\nMigration completed successfully!');
  }
}

// Main function
async function main() {
  try {
    // First check if we can connect to Supabase
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase!');
    
    // Run the migrations
    await runMigrations();
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main(); 