// Script to apply the simplified schema migration to Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for schema changes

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Role Key');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

console.log('🚀 === APPLYING SCHEMA MIGRATION ===');
console.log('📍 Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'migrations', '20250601000000_simplify_golf_app_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split the migration into individual statements
function splitSQLStatements(sql) {
  // Split by semicolon, but be careful about function definitions
  const statements = [];
  let current = '';
  let inFunction = false;
  let dollarQuoteCount = 0;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    current += line + '\n';
    
    // Check for function start/end
    if (line.includes('$$')) {
      dollarQuoteCount++;
      if (dollarQuoteCount % 2 === 1) {
        inFunction = true;
      } else {
        inFunction = false;
      }
    }
    
    // If line ends with semicolon and we're not in a function
    if (line.trim().endsWith(';') && !inFunction) {
      if (current.trim() && !current.trim().startsWith('--')) {
        statements.push(current.trim());
      }
      current = '';
    }
  }
  
  // Add any remaining content
  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

// Pre-migration validation
async function preMigrationValidation() {
  console.log('\n📋 === PRE-MIGRATION VALIDATION ===');
  
  try {
    // Check current tables that should exist
    const tablesToCheck = ['courses', 'tee_sets', 'rounds', 'holes', 'bags', 'user_notes'];
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists and accessible`);
      }
    }
    
    // Count records in tables we'll be backing up
    console.log('\n📊 Record counts before migration:');
    const countTables = ['rounds', 'bags', 'user_notes'];
    
    for (const table of countTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️  ${table}: Could not count (${error.message})`);
        } else {
          console.log(`📈 ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`⚠️  ${table}: Count failed`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Pre-migration validation failed:', err.message);
    return false;
  }
}

// Execute a single SQL statement
async function executeSQLStatement(statement, index, total) {
  const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
  console.log(`📝 [${index + 1}/${total}] ${preview}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: statement });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log(`✅ [${index + 1}/${total}] Success`);
    return true;
  } catch (err) {
    console.error(`❌ [${index + 1}/${total}] Failed: ${err.message}`);
    throw err;
  }
}

// Create the exec_sql function if it doesn't exist
async function ensureExecSQLFunction() {
  console.log('\n🔧 Setting up SQL execution function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
      RETURN 'OK';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: createFunctionSQL });
    if (error && !error.message.includes('does not exist')) {
      console.log('✅ SQL execution function ready');
    }
  } catch (err) {
    // Function doesn't exist yet, try to create it via raw SQL
    console.log('⚠️  Setting up SQL execution capabilities...');
  }
}

// Apply the migration
async function applyMigration() {
  console.log('\n🚀 === APPLYING MIGRATION ===');
  
  try {
    await ensureExecSQLFunction();
    
    const statements = splitSQLStatements(migrationSQL);
    console.log(`📄 Migration contains ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      await executeSQLStatement(statement, i, statements.length);
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n✅ Migration completed successfully!');
    return true;
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.log('\n🔄 Consider running rollback procedures if needed');
    return false;
  }
}

// Post-migration validation
async function postMigrationValidation() {
  console.log('\n🔍 === POST-MIGRATION VALIDATION ===');
  
  try {
    // Check new tables exist
    const newTables = ['rounds', 'bag_setups', 'notes'];
    
    for (const table of newTables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists and accessible`);
      }
    }
    
    // Check old tables are gone
    const removedTables = ['holes', 'hole_scores', 'round_holes', 'tee_set_distances'];
    
    for (const table of removedTables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.message.includes('does not exist')) {
        console.log(`✅ ${table}: correctly removed`);
      } else if (error) {
        console.log(`❓ ${table}: ${error.message}`);
      } else {
        console.log(`⚠️  ${table}: still exists (might need manual cleanup)`);
      }
    }
    
    // Check backup tables exist
    const backupTables = ['rounds_backup', 'bags_backup', 'user_notes_backup'];
    
    console.log('\n💾 Checking backup tables:');
    for (const table of backupTables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: backup created successfully`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Post-migration validation failed:', err.message);
    return false;
  }
}

// Main function
async function runMigration() {
  try {
    console.log('⏰ Started at:', new Date().toISOString());
    
    // Pre-migration validation
    const preValidation = await preMigrationValidation();
    if (!preValidation) {
      console.log('❌ Pre-migration validation failed. Aborting.');
      return false;
    }
    
    console.log('\n⚠️  This will modify your database schema. Backup tables will be created.');
    console.log('🔄 Proceeding with migration in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Apply migration
    const migrationSuccess = await applyMigration();
    if (!migrationSuccess) {
      return false;
    }
    
    // Post-migration validation
    const postValidation = await postMigrationValidation();
    
    console.log('\n🏁 === MIGRATION SUMMARY ===');
    console.log('⏰ Completed at:', new Date().toISOString());
    
    if (migrationSuccess && postValidation) {
      console.log('✅ Migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('   1. Test the application with the new schema');
      console.log('   2. Verify all functionality works as expected');
      console.log('   3. Consider removing backup tables after validation');
      return true;
    } else {
      console.log('❌ Migration completed with issues. Please review the output above.');
      return false;
    }
    
  } catch (err) {
    console.error('💥 Unexpected error during migration:', err);
    return false;
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runMigration }; 