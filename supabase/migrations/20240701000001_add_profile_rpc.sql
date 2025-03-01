-- Create a function to get a profile by ID
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