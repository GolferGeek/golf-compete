import { createClient } from '@/lib/supabase/server';
import { type Session } from '@supabase/supabase-js';

export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
} 