-- Supabase RPC: Find Taskers Near a Point with Category Filter
-- Usage: call this function with longitude, latitude, radius (in meters), and category ID
create or replace function find_nearby_taskers(
  task_lon double precision,
  task_lat double precision,
  search_radius_meters integer,
  target_category_id uuid
)
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  role text,
  is_verified boolean,
  hourly_rate numeric,
  distance_meters double precision,
  verified_at timestamp with time zone
) as $$
begin
  return query
    select
      p.id as profile_id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.bio,
      p.role,
      p.is_verified,
      COALESCE(td.hourly_rate, 25) as hourly_rate,
      ST_Distance(td.location::geography, ST_SetSRID(ST_MakePoint(task_lon, task_lat), 4326)::geography) as distance_meters,
      p.verified_at
    from profiles p
    inner join tasker_details td on p.id = td.profile_id
    inner join tasker_categories tc on p.id = tc.profile_id
    where
      td.location is not null and -- Ensure tasker has a location in tasker_details
      p.role = 'tasker' and -- Only taskers
      p.is_verified = true and -- Only verified taskers
      ST_DWithin(
        td.location::geography,
        ST_SetSRID(ST_MakePoint(task_lon, task_lat), 4326)::geography,
        search_radius_meters
      ) and
      tc.category_id = target_category_id -- Filter by category (required)
    order by distance_meters asc;
end;
$$ language plpgsql security definer;

-- Blueprint alignment: This function enables geospatial tasker discovery as required by Section 2 and Section 4 of the blueprint.
