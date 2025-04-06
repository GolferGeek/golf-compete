import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
export type { Profile as User };

export async function getCurrentUser(): Promise<Profile | null> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error('Error getting session:', authError);
    throw authError;
  }

  if (!session?.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select()
    .eq('id', session.user.id)
    .single()
    .returns<Profile>();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw profileError;
  }

  return profile;
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select()
    .returns<Profile[]>();

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  return profiles || [];
} 