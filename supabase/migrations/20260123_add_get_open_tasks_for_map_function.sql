-- ============================================================================
-- Migration: Add get_open_tasks_for_map function
-- ============================================================================
-- This function returns all open tasks with location coordinates for map display
-- ============================================================================

CREATE OR REPLACE FUNCTION get_open_tasks_for_map()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    location_text TEXT,
    location_coordinates TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    scheduled_date DATE,
    scheduled_time_slot TEXT,
    budget NUMERIC(10,2),
    category_id UUID,
    category_name_fi TEXT,
    user_id UUID,
    user_profile_id UUID,
    user_first_name TEXT,
    user_last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.description,
        t.location_text,
        ST_AsText(t.location_coordinates::geometry) as location_coordinates,
        t.status,
        t.created_at,
        t.scheduled_date,
        t.scheduled_time_slot,
        t.budget,
        t.category_id,
        c.name_fi as category_name_fi,
        t.user_id,
        p.id as user_profile_id,
        p.first_name as user_first_name,
        p.last_name as user_last_name
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN profiles p ON t.user_id = p.id
    WHERE t.status = 'open'
      AND t.posting_type = 'open'
      AND t.location_coordinates IS NOT NULL
    ORDER BY t.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_open_tasks_for_map() TO authenticated;
GRANT EXECUTE ON FUNCTION get_open_tasks_for_map() TO anon;

COMMENT ON FUNCTION get_open_tasks_for_map IS 'Returns all open tasks with location coordinates for map display';
