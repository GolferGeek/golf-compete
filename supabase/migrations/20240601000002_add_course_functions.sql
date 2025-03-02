-- Create a function to update a course with is_active field
CREATE OR REPLACE FUNCTION update_course_with_active(
  p_id UUID,
  p_name TEXT,
  p_location TEXT,
  p_par INTEGER,
  p_holes INTEGER,
  p_rating NUMERIC,
  p_slope INTEGER,
  p_amenities TEXT,
  p_website TEXT,
  p_phone_number TEXT,
  p_is_active BOOLEAN
)
RETURNS SETOF courses AS $$
BEGIN
  RETURN QUERY
  UPDATE courses
  SET 
    name = p_name,
    location = p_location,
    par = p_par,
    holes = p_holes,
    rating = p_rating,
    slope = p_slope,
    amenities = p_amenities,
    website = p_website,
    phone_number = p_phone_number,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to insert a course with is_active field
CREATE OR REPLACE FUNCTION insert_course_with_active(
  p_name TEXT,
  p_location TEXT,
  p_par INTEGER,
  p_holes INTEGER,
  p_rating NUMERIC,
  p_slope INTEGER,
  p_amenities TEXT,
  p_website TEXT,
  p_phone_number TEXT,
  p_is_active BOOLEAN
)
RETURNS SETOF courses AS $$
BEGIN
  RETURN QUERY
  INSERT INTO courses (
    name,
    location,
    par,
    holes,
    rating,
    slope,
    amenities,
    website,
    phone_number,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_name,
    p_location,
    p_par,
    p_holes,
    p_rating,
    p_slope,
    p_amenities,
    p_website,
    p_phone_number,
    p_is_active,
    NOW(),
    NOW()
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 