-- Backup existing data if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        CREATE TEMP TABLE courses_backup AS SELECT * FROM courses;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tee_sets') THEN
        CREATE TEMP TABLE tee_sets_backup AS SELECT * FROM tee_sets;
    END IF;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tee_sets CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    website TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tee sets table
CREATE TABLE tee_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- e.g., "Blue", "White", "Red"
    color TEXT NOT NULL, -- Actual color for UI display
    par INTEGER NOT NULL CHECK (par BETWEEN 62 AND 74),
    rating DECIMAL(4,1) NOT NULL CHECK (rating BETWEEN 55.0 AND 78.0),
    slope INTEGER NOT NULL CHECK (slope BETWEEN 55 AND 155),
    yardage INTEGER NOT NULL CHECK (yardage BETWEEN 4000 AND 8000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, name)  -- Prevent duplicate tee set names per course
);

-- Restore backed up data if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename = 'courses_backup') THEN
        INSERT INTO courses 
        SELECT * FROM courses_backup;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename = 'tee_sets_backup') THEN
        INSERT INTO tee_sets 
        SELECT * FROM tee_sets_backup;
    END IF;
END $$;

-- Add indexes
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_location ON courses(city, state, country);
CREATE INDEX idx_tee_sets_course_id ON tee_sets(course_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_sets ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Courses are viewable by everyone"
ON courses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert courses"
ON courses FOR INSERT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Only admins can update courses"
ON courses FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Only admins can delete courses"
ON courses FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Tee sets policies
CREATE POLICY "Tee sets are viewable by everyone"
ON tee_sets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert tee sets"
ON tee_sets FOR INSERT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Only admins can update tee sets"
ON tee_sets FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Only admins can delete tee sets"
ON tee_sets FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
); 