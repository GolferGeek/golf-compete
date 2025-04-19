-- Create function for bulk replacing tee sets for a course
CREATE OR REPLACE FUNCTION public.replace_course_tees(
    p_course_id UUID,
    p_tees JSONB
) RETURNS VOID AS $$
BEGIN
    -- Delete existing tee sets
    DELETE FROM public.tee_sets
    WHERE course_id = p_course_id;
    
    -- Insert new tee sets
    WITH tees AS (
        SELECT * FROM jsonb_to_recordset(p_tees) AS x(
            tee_name TEXT,
            gender TEXT,
            par INTEGER,
            course_rating NUMERIC,
            slope_rating INTEGER,
            yardage INTEGER,
            color TEXT,
            course_id UUID
        )
    )
    INSERT INTO public.tee_sets (
        id,
        course_id,
        name,
        gender,
        par,
        rating,
        slope,
        yardage,
        color
    )
    SELECT
        uuid_generate_v4(),
        p_course_id,
        tee_name,
        gender,
        par,
        course_rating,
        slope_rating,
        yardage,
        color
    FROM tees;
END;
$$ LANGUAGE plpgsql; 