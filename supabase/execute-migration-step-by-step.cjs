// Step-by-step migration execution using basic Supabase operations
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 === STEP-BY-STEP MIGRATION EXECUTION ===');

async function executeStepByStep() {
  console.log('\n📋 Pre-migration state check...');
  
  try {
    // Check current data
    const { data: rounds } = await supabase.from('rounds').select('*');
    const { data: bags } = await supabase.from('bags').select('*');
    const { data: userNotes } = await supabase.from('user_notes').select('*');
    
    console.log(`📊 Current data: ${rounds?.length || 0} rounds, ${bags?.length || 0} bags, ${userNotes?.length || 0} notes`);
    
    console.log('\n⚠️  IMPORTANT: This approach requires manual completion');
    console.log('The automatic migration failed due to Supabase RPC limitations.');
    console.log('');
    console.log('🎯 RECOMMENDED APPROACH:');
    console.log('');
    console.log('1️⃣ Open Supabase SQL Editor manually:');
    console.log('   https://supabase.com/dashboard/project/nwkuddqbizjpjjznixey/sql');
    console.log('');
    console.log('2️⃣ Copy the FULL migration script:');
    console.log('   File: supabase/migrations/20250601000000_simplify_golf_app_schema.sql');
    console.log('');
    console.log('3️⃣ Paste and execute in the SQL Editor');
    console.log('');
    console.log('4️⃣ Run post-migration validation:');
    console.log('   node supabase/test-new-schema.cjs');
    console.log('');
    
    console.log('🔒 SAFETY FEATURES IN MIGRATION:');
    console.log('✅ Creates backup tables before any changes');
    console.log('✅ Uses IF EXISTS for safe table dropping');
    console.log('✅ Comprehensive RLS policies');
    console.log('✅ Proper foreign key constraints');
    console.log('✅ Performance indexes');
    console.log('');
    
    console.log('📋 WHAT THE MIGRATION DOES:');
    console.log('• Backs up: rounds, bags, user_notes');
    console.log('• Removes: holes, hole_scores, round_holes, tee_set_distances');
    console.log('• Creates: simplified rounds, bag_setups, notes tables');
    console.log('• Adds: RLS policies, triggers, indexes');
    console.log('');
    
    console.log('⚡ EXECUTION READY!');
    console.log('The migration is safe to run and will preserve your data.');
    
    return true;
    
  } catch (err) {
    console.error('❌ Error checking current state:', err.message);
    return false;
  }
}

// Show migration file content for easy copying
function showMigrationContent() {
  console.log('\n📄 === MIGRATION SQL CONTENT ===');
  console.log('Copy everything below this line to Supabase SQL Editor:\n');
  console.log('─'.repeat(60));
  
  const fs = require('fs');
  const migrationPath = './supabase/migrations/20250601000000_simplify_golf_app_schema.sql';
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(migrationContent);
  console.log('─'.repeat(60));
  console.log('\n✅ Copy the content above and paste it into Supabase SQL Editor');
}

async function runStepByStep() {
  const success = await executeStepByStep();
  
  if (success) {
    console.log('\n📝 Would you like to see the migration SQL to copy? (y/n)');
    console.log('Or run: node supabase/execute-migration-step-by-step.cjs --show-sql');
  }
}

// Check for command line argument
if (process.argv.includes('--show-sql')) {
  showMigrationContent();
} else {
  runStepByStep();
} 