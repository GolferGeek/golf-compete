-- Create function for executing SQL directly (for migrations)
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql; 