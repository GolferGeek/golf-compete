-- Split location into city and state
ALTER TABLE courses 
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;

-- Update the new columns from the location field
UPDATE courses 
SET 
  city = SPLIT_PART(location, ', ', 1),
  state = SPLIT_PART(location, ', ', 2);

-- Make the new columns NOT NULL after populating them
ALTER TABLE courses 
ALTER COLUMN city SET NOT NULL,
ALTER COLUMN state SET NOT NULL;

-- Drop the old location column
ALTER TABLE courses DROP COLUMN location;

-- Add comments
COMMENT ON COLUMN courses.city IS 'City where the course is located';
COMMENT ON COLUMN courses.state IS 'State where the course is located'; 