// Script to prepare a clean SQL file for manual execution in Supabase Dashboard
const fs = require('fs');

console.log('=== PREPARING SQL FOR SUPABASE DASHBOARD ===');

// Read the migration SQL file
const migrationSql = fs.readFileSync('supabase-migration.sql', 'utf8');

// Process the SQL file to clean it up
function cleanupSql(sqlContent) {
  // Remove SQL comments that start with -- and span to the end of the line
  let cleanedSql = sqlContent.replace(/--.*$/gm, '');
  
  // Remove empty lines
  cleanedSql = cleanedSql.split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');
  
  // Add a newline after each semicolon for better readability
  cleanedSql = cleanedSql.replace(/;/g, ';\n\n');
  
  return cleanedSql;
}

const cleanedSql = cleanupSql(migrationSql);

// Write the cleaned SQL to a new file
const outputFile = 'supabase-dashboard.sql';
fs.writeFileSync(outputFile, cleanedSql);

console.log(`SQL prepared and saved to ${outputFile}`);
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/project/_/sql');
console.log('2. Open the SQL Editor');
console.log('3. Copy and paste the contents of supabase-dashboard.sql into the editor');
console.log('4. Click "Run" to execute the SQL statements');
console.log('');
console.log('NOTE: You may need to run the statements in smaller batches if they time out or if you encounter errors.');
console.log('      Consider splitting the file into multiple parts if needed.'); 