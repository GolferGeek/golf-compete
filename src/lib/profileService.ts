import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Database } from '@/types/supabase';
import { userServiceForProfile } from './userService';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type Profile = DbProfile;

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
  const supabase = getSupabaseBrowserClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error('Error getting session:', authError);
    throw authError;
  }

  if (!session?.user) {
    return null;
  }

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw profileError;
  }

  return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  return data || [];
}

type ProfileWithAuthUser = Profile & {
  auth_user: { email: string } | null;
};

export async function getProfilesWithEmail(): Promise<ProfileWithEmail[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      auth_user:id (
        email
      )
    `) as unknown as { data: ProfileWithAuthUser[] | null, error: any };

  if (error) {
    console.error('Error fetching profiles with email:', error);
    throw error;
  }

  return (data || []).map(profile => ({
    ...profile,
    user_email: profile.auth_user?.email
  }));
}

export async function createProfile(data: CreateProfileData): Promise<Profile> {
  const supabase = getSupabaseBrowserClient();
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
      .select('*')
      .single();

    if (error) {
      // If profile creation fails, clean up the auth user
      await userServiceForProfile.deleteAuthUser(user.id);
      throw error;
    }

    if (!profile) {
      throw new Error('Failed to create profile');
    }

    return profile;
  } catch (error) {
    // Clean up on any error
    await userServiceForProfile.deleteAuthUser(user.id);
    throw error;
  }
}

export async function deleteProfile(profileId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
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
  const supabase = getSupabaseBrowserClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', profileId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  if (!profile) {
    throw new Error('Failed to update profile');
  }

  return profile;
}

/**
 * Get all profiles that are not participants in a specific series
 */
export async function getProfilesNotInSeries(seriesId: string): Promise<ProfileWithEmail[]> {
  const supabase = getSupabaseBrowserClient();
  console.log('Fetching profiles not in series:', seriesId);
  
  // Use the database function to get non-participants
  const { data: profiles, error: profilesError } = await supabase
    .rpc('get_non_series_participants', {
      p_series_id: seriesId
    });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  if (!profiles) {
    console.log('No profiles found');
    return [];
  }

  console.log('Found profiles:', profiles);

  // Get the emails using the same join we use in getProfilesWithEmail
  const { data, error: emailsError } = await supabase
    .from('profiles')
    .select(`
      *,
      auth_user:id (
        email
      )
    `)
    .in('id', profiles.map(p => p.id)) as unknown as { data: ProfileWithAuthUser[] | null, error: any };

  if (emailsError) {
    console.error('Error fetching user emails:', emailsError);
    // Continue without emails rather than failing
    console.log('Continuing without emails');
    return profiles.map(profile => ({
      ...profile,
      user_email: undefined
    }));
  }

  // Create a map of profile id to email
  const emailMap = new Map(data?.map(p => [p.id, p.auth_user?.email]) || []);

  // Combine the data
  return profiles.map(profile => ({
    ...profile,
    user_email: emailMap.get(profile.id)
  }));
} 