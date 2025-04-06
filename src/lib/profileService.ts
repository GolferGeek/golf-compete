import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { userServiceForProfile } from './userService';

type Profile = Database['public']['Tables']['profiles']['Row'];
export type { Profile };

export interface ProfileWithEmail extends Profile {
  user_email?: string;
}

export interface CreateProfileData {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  handicap?: number | null;
  is_admin?: boolean;
  multiple_clubs_sets?: boolean;
}

export async function getCurrentProfile(): Promise<Profile | null> {
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

export async function getAllProfiles(): Promise<Profile[]> {
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

export async function getProfilesWithEmail(): Promise<ProfileWithEmail[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      *,
      auth_user:id (
        email
      )
    `)
    .returns<(Profile & { auth_user: { email: string } | null })[]>();

  if (error) {
    console.error('Error fetching profiles with email:', error);
    throw error;
  }

  return (profiles || []).map(profile => ({
    ...profile,
    user_email: profile.auth_user?.email
  }));
}

export async function createProfile(data: CreateProfileData): Promise<Profile> {
  // Create auth user first
  const user = await userServiceForProfile.createAuthUser({
    email: data.email,
    password: data.password
  });
  
  try {
    // Create profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        handicap: data.handicap,
        is_admin: data.is_admin || false,
        multiple_clubs_sets: data.multiple_clubs_sets
      })
      .select()
      .single()
      .returns<Profile>();

    if (error) {
      // If profile creation fails, clean up the auth user
      await userServiceForProfile.deleteAuthUser(user.id);
      throw error;
    }

    return profile;
  } catch (error) {
    // Clean up on any error
    await userServiceForProfile.deleteAuthUser(user.id);
    throw error;
  }
}

export async function deleteProfile(profileId: string): Promise<void> {
  // Delete profile first
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (profileError) throw profileError;

  // Then delete auth user
  await userServiceForProfile.deleteAuthUser(profileId);
}

export async function updateProfile(profileId: string, data: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', profileId)
    .select()
    .single()
    .returns<Profile>();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return profile;
} 