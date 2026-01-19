import { Database } from '@/lib/supabase/database.types'; // Import Database types
import { createClient } from '@/lib/supabase/server';

// Derive the return type from the generated function definition
type FindNearbyTaskersReturns = Database['public']['Functions']['find_nearby_taskers']['Returns'];
// Define the expected individual tasker type, ensuring location matches the manually corrected type
// Also correct profile_id to id based on the updated SQL function
export type NearbyTasker = Omit<FindNearbyTaskersReturns[number], 'location' | 'profile_id'> & {
  id: string; // Ensure id is present
  location: Database['public']['Tables']['profiles']['Row']['location'];
};

/**
 * Finds taskers near a given point using the Supabase RPC function.
 * @param lng Longitude (number)
 * @param lat Latitude (number)
 * @param radiusMeters Search radius in meters (number)
 * @param categoryId Target category ID (string)
 * @returns Array of nearby taskers with distance
 */
export async function findNearbyTaskers(lng: number, lat: number, radiusMeters: number, categoryId: string): Promise<NearbyTasker[]> {
  const supabase = await createClient();

  // Use the full function type definition from generated types for the RPC call
  const { data, error } = await supabase.rpc('find_nearby_taskers', {
    task_lat: lat,
    task_lon: lng,
    search_radius_meters: radiusMeters,
    target_category_id: categoryId
  });

  if (error) {
    console.error("Error finding nearby taskers:", error);
    throw new Error(`Failed to find nearby taskers: ${error.message}`);
  }

  // Manually map the data to the NearbyTasker type if data exists
  // This handles potential discrepancies between generated types and the actual SQL return
  if (data) {
    // Assume the raw data might have profile_id and location: unknown
    const rawData = data as any[]; // Cast to any[] to access potentially incorrect properties
    return rawData.map(item => ({
      ...item,
      id: item.id ?? item.profile_id, // Use id if present, fallback to profile_id
      location: item.location as Database['public']['Tables']['profiles']['Row']['location'], // Assert location type
    }));
  }

  // Return empty array if data is null/undefined
  return [];
}

// Blueprint alignment: This utility integrates the geospatial query for tasker discovery, as required by Section 2 and Section 4 of the blueprint. It now uses corrected types derived from generated types and matches the updated SQL function signature. Includes manual mapping for robustness against type generation issues.
