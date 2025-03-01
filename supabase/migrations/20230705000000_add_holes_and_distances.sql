-- Create holes table
CREATE TABLE IF NOT EXISTS holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  handicap_index INTEGER,
  length INTEGER,
  description TEXT,
  UNIQUE(course_id, hole_number)
);

-- Create tee_set_distances table
CREATE TABLE IF NOT EXISTS tee_set_distances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tee_set_id UUID NOT NULL REFERENCES tee_sets(id) ON DELETE CASCADE,
  hole_id UUID NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
  distance INTEGER NOT NULL,
  UNIQUE(tee_set_id, hole_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_holes_course_id ON holes(course_id);
CREATE INDEX IF NOT EXISTS idx_tee_set_distances_tee_set_id ON tee_set_distances(tee_set_id);
CREATE INDEX IF NOT EXISTS idx_tee_set_distances_hole_id ON tee_set_distances(hole_id);

-- Add RLS policies
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_set_distances ENABLE ROW LEVEL SECURITY;

-- Everyone can view holes and distances
CREATE POLICY "Holes are viewable by everyone" 
  ON holes FOR SELECT 
  USING (true);

CREATE POLICY "Tee set distances are viewable by everyone" 
  ON tee_set_distances FOR SELECT 
  USING (true);

-- During development, allow anyone to insert/update/delete
-- In production, you would restrict this to admins only
CREATE POLICY "Anyone can insert holes during development" 
  ON holes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update holes during development" 
  ON holes FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete holes during development" 
  ON holes FOR DELETE 
  USING (true);

CREATE POLICY "Anyone can insert tee set distances during development" 
  ON tee_set_distances FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update tee set distances during development" 
  ON tee_set_distances FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete tee set distances during development" 
  ON tee_set_distances FOR DELETE 
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE holes IS 'Individual holes for golf courses';
COMMENT ON COLUMN holes.hole_number IS 'The number of the hole (1-18)';
COMMENT ON COLUMN holes.par IS 'The par value for the hole';
COMMENT ON COLUMN holes.handicap_index IS 'The handicap index/difficulty ranking of the hole (1-18)';
COMMENT ON COLUMN holes.length IS 'Optional general length in yards (specific distances are in tee_set_distances)';

COMMENT ON TABLE tee_set_distances IS 'Distances from each tee set to each hole';
COMMENT ON COLUMN tee_set_distances.distance IS 'Distance in yards from the tee to the hole'; 