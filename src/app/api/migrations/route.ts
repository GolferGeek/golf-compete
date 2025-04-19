import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Define the result type
interface MigrationResult {
  file: string;
  success: boolean;
  error?: string;
}

/**
 * @swagger
 * /api/migrations:
 *   post:
 *     summary: Run database migrations
 *     description: Applies SQL migrations to the database
 *     tags: [Migrations]
 *     responses:
 *       200: { description: Migrations applied successfully }
 *       500: { description: Server error }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dirPath = path.join(process.cwd(), 'src/app/api/migrations');
    
    // Get all .sql files in the migrations directory
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    const results: MigrationResult[] = [];
    
    // Execute each migration file
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error(`Error executing migration ${file}:`, error);
          results.push({
            file,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Successfully applied migration: ${file}`);
          results.push({
            file,
            success: true
          });
        }
      } catch (err) {
        console.error(`Exception executing migration ${file}:`, err);
        results.push({
          file,
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in migrations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 