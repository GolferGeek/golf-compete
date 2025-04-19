-- Create function for bulk replacing holes for a course
CREATE OR REPLACE FUNCTION public.replace_course_holes(
    p_course_id UUID,
    p_holes JSONB
) RETURNS VOID AS $$
BEGIN
    -- Delete existing holes
    DELETE FROM public.holes
    WHERE course_id = p_course_id;
    
    -- Insert new holes
    WITH holes AS (
        SELECT * FROM jsonb_to_recordset(p_holes) AS x(
            hole_number INTEGER,
            par INTEGER,
            handicap_index INTEGER,
            yards INTEGER,
            notes TEXT,
            course_id UUID
        )
    )
    INSERT INTO public.holes (
        id,
        course_id,
        hole_number,
        par,
        handicap_index,
        yards,
        notes
    )
    SELECT
        uuid_generate_v4(),
        p_course_id,
        hole_number,
        par,
        handicap_index,
        yards,
        notes
    FROM holes;
END;
$$ LANGUAGE plpgsql; 