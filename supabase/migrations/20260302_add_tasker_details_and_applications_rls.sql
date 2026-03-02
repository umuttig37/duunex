-- Add add_tasker_details RPC (used by tasker signup form).
-- Inserts/updates tasker_details with location, rate, radius, and availability.
CREATE OR REPLACE FUNCTION public.add_tasker_details(
  p_profile_id uuid,
  p_longitude double precision,
  p_latitude double precision,
  p_hourly_rate numeric,
  p_service_radius_meters integer,
  p_availability_schedule text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tasker_details (
    profile_id,
    location,
    hourly_rate,
    service_radius_meters,
    availability_schedule
  )
  VALUES (
    p_profile_id,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_hourly_rate,
    p_service_radius_meters,
    CASE WHEN p_availability_schedule IS NULL OR trim(p_availability_schedule) = '' THEN NULL ELSE p_availability_schedule::jsonb END
  )
  ON CONFLICT (profile_id)
  DO UPDATE SET
    location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    hourly_rate = EXCLUDED.hourly_rate,
    service_radius_meters = EXCLUDED.service_radius_meters,
    availability_schedule = COALESCE(
      NULLIF(trim(p_availability_schedule), '')::jsonb,
      tasker_details.availability_schedule
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_tasker_details(uuid, double precision, double precision, numeric, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_tasker_details(uuid, double precision, double precision, numeric, integer, text) TO anon;

-- RLS: allow users to create and read their own tasker application
CREATE POLICY "Users can insert own tasker application" ON tasker_applications
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view own tasker application" ON tasker_applications
  FOR SELECT
  USING (auth.uid() = profile_id);
