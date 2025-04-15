-- Function to create a series and add the creator as an admin participant
CREATE OR REPLACE FUNCTION public.create_series_and_add_admin(
    p_name TEXT,
    p_description TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_status TEXT,
    p_created_by UUID -- The ID of the user creating the series
)
RETURNS TABLE(created_series_id UUID) -- Return the ID of the new series
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with definer's privileges (usually postgres)
AS $$
DECLARE
    new_series_id UUID;
BEGIN
    -- Insert the new series
    INSERT INTO public.series (name, description, start_date, end_date, status, created_by)
    VALUES (p_name, p_description, p_start_date, p_end_date, p_status, p_created_by)
    RETURNING id INTO new_series_id;

    -- Add the creator as an admin participant
    INSERT INTO public.series_participants (user_id, series_id, role, status)
    VALUES (p_created_by, new_series_id, 'admin', 'confirmed'); -- Assuming 'confirmed' status for creator

    -- Return the new series ID
    RETURN QUERY SELECT new_series_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (optional, depends on your logging setup)
        RAISE WARNING 'Error in create_series_and_add_admin: % ', SQLERRM;
        -- Re-raise the exception to ensure transaction rollback
        RAISE;
END;
$$;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.create_series_and_add_admin(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, UUID) TO authenticated; 