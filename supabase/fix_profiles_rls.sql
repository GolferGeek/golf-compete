-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view other admins" ON profiles;
DROP POLICY IF EXISTS "Only admins can update admin status" ON profiles;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Direct query to avoid RLS recursion
  SELECT p.is_admin INTO is_admin_user
  FROM profiles p
  WHERE p.id = user_id;
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get a profile by ID (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id UUID)
RETURNS SETOF profiles AS $$
BEGIN
  -- This function bypasses RLS because it's SECURITY DEFINER
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the admin policies using the function
CREATE POLICY "Admins can view all profiles" 
  ON profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  );

-- Only admins can update admin status
CREATE POLICY "Only admins can update admin status" 
  ON profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id OR
    public.is_admin(auth.uid())
  ); 