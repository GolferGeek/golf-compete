-- Create tee_sets table
CREATE TABLE IF NOT EXISTS tee_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  slope NUMERIC,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tee_sets_course_id ON tee_sets(course_id);

-- Add RLS policies
ALTER TABLE tee_sets ENABLE ROW LEVEL SECURITY;

-- Everyone can view tee sets
CREATE POLICY "Tee sets are viewable by everyone" 
  ON tee_sets FOR SELECT 
  USING (true);

-- During development, allow anyone to insert/update/delete
-- In production, you would restrict this to admins only
CREATE POLICY "Anyone can insert tee sets during development" 
  ON tee_sets FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update tee sets during development" 
  ON tee_sets FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete tee sets during development" 
  ON tee_sets FOR DELETE 
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE tee_sets IS 'Tee sets for golf courses (e.g., Blue, White, Red)';
COMMENT ON COLUMN tee_sets.name IS 'The name of the tee set';
COMMENT ON COLUMN tee_sets.color IS 'The color associated with the tee set';
COMMENT ON COLUMN tee_sets.slope IS 'The slope rating for the tee set';
COMMENT ON COLUMN tee_sets.rating IS 'The course rating for the tee set';
