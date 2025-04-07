import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

// Internal types
interface CreateUserData {
  email: string;
  password: string;
}

// This service should ONLY be used internally by profileService
// Private/Internal functions
async function deleteAuthUser(userId: string) {
  const supabase = getSupabaseBrowserClient();
  // First check if the user exists
  const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
  if (fetchError) throw fetchError;
  if (!user) throw new Error('User not found');

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function createAuthUser({ email, password }: CreateUserData) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  if (!data.user) throw new Error('Failed to create user');
  
  return data.user;
}

// Only export what's absolutely necessary for the profile service
export const userServiceForProfile = {
  deleteAuthUser,
  createAuthUser
}; 