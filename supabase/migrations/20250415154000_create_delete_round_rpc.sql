-- Function to delete a round and its associated scores transactionally
CREATE OR REPLACE FUNCTION public.delete_round_and_scores(
    p_round_id UUID
)
RETURNS VOID -- Doesn't need to return anything
LANGUAGE plpgsql
SECURITY DEFINER -- May need elevated privileges to delete from multiple tables
AS $$
BEGIN
    -- Delete associated scores first
    DELETE FROM public.scores
    WHERE round_id = p_round_id;

    -- Delete the round itself
    DELETE FROM public.rounds
    WHERE id = p_round_id;

    -- Check if the round existed - optional, raises error if not found
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round with ID % not found', p_round_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE WARNING 'Error in delete_round_and_scores for round %: %', p_round_id, SQLERRM;
        -- Re-raise the exception to ensure transaction rollback
        RAISE;
END;
$$;

-- Grant execution permission (adjust role if needed)
GRANT EXECUTE ON FUNCTION public.delete_round_and_scores(UUID) TO authenticated; 