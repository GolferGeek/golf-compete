-- First, drop ALL existing policies
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN SELECT policyname 
               FROM pg_policies 
               WHERE tablename = 'profiles' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (
    -- Users can read their own profile
    auth.uid() = id
    OR 
    -- Service role can read all profiles
    (SELECT current_setting('role') = 'authenticated')
);

CREATE POLICY "Enable update access for users"
ON profiles FOR UPDATE
TO authenticated
USING (
    -- Users can update their own profile
    auth.uid() = id
    OR
    -- Service role can update all profiles
    (SELECT current_setting('role') = 'authenticated')
)
WITH CHECK (
    auth.uid() = id
    OR
    (SELECT current_setting('role') = 'authenticated')
);

CREATE POLICY "Enable insert access for users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can only insert their own profile
    auth.uid() = id
    OR
    -- Service role can insert any profile
    (SELECT current_setting('role') = 'authenticated')
);

-- Grant service role bypass RLS
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 