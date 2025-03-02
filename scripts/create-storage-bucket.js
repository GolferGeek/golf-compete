require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBucket() {
  try {
    // Create the bucket
    const { data, error } = await supabase
      .storage
      .createBucket('golf-compete', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    
    console.log('Bucket created successfully:', data);
    
    // Set bucket policy to public
    const { error: policyError } = await supabase
      .storage
      .from('golf-compete')
      .createSignedUrl('dummy.txt', 60);
    
    if (policyError && !policyError.message.includes('not found')) {
      console.error('Error setting bucket policy:', policyError);
      return;
    }
    
    console.log('Bucket setup completed successfully');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createBucket();
