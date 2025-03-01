-- Add isAdmin flag to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update the column comment
COMMENT ON COLUMN profiles.is_admin IS 'Flag indicating if the user has administrator privileges';

-- Create admin policies
-- Only admins can view other admins
CREATE POLICY "Admins can view other admins" 
  ON profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
      )
    )
  );

-- Only admins can update admin status
CREATE POLICY "Only admins can update admin status" 
  ON profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  ); 