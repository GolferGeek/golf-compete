console.log('Checking for event with ID: cb2243a1-ee6f-4726-80a7-31bd9b0e2ee7'); const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); async function checkEvent() { const { data, error } = await supabase.from('events').select('*').eq('id', 'cb2243a1-ee6f-4726-80a7-31bd9b0e2ee7'); if (error) console.error('Error:', error); else console.log('Event found:', data); } checkEvent();
