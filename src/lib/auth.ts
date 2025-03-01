import { createClient } from '@supabase/supabase-js';
import { User } from '../types/golf';

// Supabase client for all operations
// Using the anon key for all operations
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Authenticate a user by email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (error || !data.user) {
    console.error('Authentication error:', error);
    return null;
  }
  
  // Get the user profile from Supabase
  const { data: profileData, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }
  
  // Convert the Supabase user to the User type
  return {
    id: data.user.id,
    name: `${profileData.first_name} ${profileData.last_name}`,
    email: data.user.email!,
    handicap: profileData.handicap || undefined,
    profileImage: data.user.user_metadata?.avatar_url || undefined,
    memberSince: new Date(profileData.created_at),
  };
}

/**
 * Create a new user
 */
export async function createUser(
  name: string, 
  email: string, 
  password: string
): Promise<User | null> {
  // Split the name into first and last name
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  // Create the user in Supabase Auth
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });
  
  if (error || !data.user) {
    console.error('Error creating user:', error);
    return null;
  }
  
  // Create the user profile in Supabase
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (profileError) {
    console.error('Error creating user profile:', profileError);
    return null;
  }
  
  return {
    id: data.user.id,
    name: name,
    email: email,
    memberSince: new Date(),
  };
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  // Get the user from Supabase Auth
  const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(id);
  
  if (userError || !userData.user) {
    console.error('Error fetching user:', userError);
    return null;
  }
  
  // Get the user profile from Supabase
  const { data: profileData, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }
  
  return {
    id: userData.user.id,
    name: `${profileData.first_name} ${profileData.last_name}`,
    email: userData.user.email!,
    handicap: profileData.handicap || undefined,
    profileImage: userData.user.user_metadata?.avatar_url || undefined,
    memberSince: new Date(profileData.created_at),
  };
} 