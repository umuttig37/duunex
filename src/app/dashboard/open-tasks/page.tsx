import EnhancedTaskerMapContent from '@/components/features/dashboard/enhanced-tasker-map-content';
import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Helper to parse PostGIS point string to lat/lng
const parsePostGISCoordinates = (pgPoint: string | null | undefined): { lat: number; lng: number } | null => {
  if (!pgPoint || !pgPoint.startsWith('POINT(')) return null;
  try {
    const coordString = pgPoint.substring(pgPoint.indexOf('(') + 1, pgPoint.indexOf(')'));
    const parts = coordString.split(' ');
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch (error) {
    console.error("Error parsing coordinates:", pgPoint, error);
    return null;
  }
};

export default async function OpenTasksPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get profile with full details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'tasker') {
    redirect('/dashboard');
  }

  // Get tasker's details including location and categories
  const { data: taskerDetails } = await supabase
    .from('tasker_details')
    .select(`
      *,
      tasker_categories(
        category_id,
        categories(name_fi, name)
      )
    `)
    .eq('profile_id', user.id)
    .single();

  // Get tasker's categories for filtering
  const taskerCategories = taskerDetails?.tasker_categories?.map(
    (tc: any) => tc.categories?.name_fi || tc.categories?.name
  ).filter(Boolean) || [];

  // Get tasker's category IDs for filtering
  const taskerCategoryIds = taskerDetails?.tasker_categories?.map(
    (tc: any) => tc.category_id
  ).filter(Boolean) || [];

  // Fetch open tasks using the same RPC function as the dashboard for proper coordinate handling
  const { data: rpcOpenData, error: tasksError } = await supabase.rpc(
    'get_open_tasks_for_map'
  );

  // Transform RPC data to match the expected format
  const openTasks = rpcOpenData ? rpcOpenData.map((task: any) => {
    // Parse coordinates from PostGIS format
    const coords = parsePostGISCoordinates(task.location_coordinates);
    
    return {
      // Required fields from RPC return
      id: task.id,
      title: task.title,
      description: task.description,
      location_text: task.location_text,
      location_coordinates: task.location_coordinates,
      status: task.status,
      created_at: task.created_at,
      scheduled_date: task.scheduled_date,
      scheduled_time_slot: task.scheduled_time_slot,
      budget: task.budget,
      category_id: task.category_id,
      user_id: task.user_id,
      
      // Fields that DashboardTask expects (parse coordinates)
      assigned_tasker_id: null,
      image_url: null,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      posting_type: null,
      updated_at: task.created_at,
      offers_count: 0,
    
      // Transform category data
      categories: task.category_name_fi ? {
        id: task.category_id,
        name_fi: task.category_name_fi,
        name: task.category_name_fi,
        icon_url: null
      } : null,
    
      // Transform user profile data
      user_profile: task.user_profile_id ? {
        id: task.user_profile_id,
        first_name: task.user_first_name,
        last_name: task.user_last_name,
        avatar_url: null
      } : null,
      
      // Additional fields
      task_attachments: null,
      assigned_tasker_profile: null,
      user_review: null,
      accepted_offer: null,
      message_count: 0
    };
  }) : [];

  if (tasksError) {
    console.error('Error fetching open tasks:', tasksError);
  }

  // Filter tasks based on tasker's selected categories
  const filteredTasks = openTasks.filter(task => {
    // If tasker has no categories selected, show all tasks (fallback)
    if (taskerCategoryIds.length === 0) {
      return true;
    }
    
    // Only show tasks that match the tasker's categories
    return task.category_id && taskerCategoryIds.includes(task.category_id);
  });

  const openTasksForMap = filteredTasks;

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Avoimet tehtävät
            </h1>
            <p className="text-gray-600 mt-2">
              Löydä kiinnostavia tehtäviä alueeltasi ja tee tarjouksia
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">
              {openTasksForMap.length}
            </div>
            <div className="text-sm text-gray-500">
              {taskerCategories.length > 0 ? 'kategorioihisi sopivaa tehtävää' : 'avointa tehtävää'}
            </div>
            {taskerCategories.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Suodatettu valittujen kategorioiden mukaan
              </div>
            )}
          </div>
        </div>
        
        <EnhancedTaskerMapContent 
          taskerId={user.id}
          openTasksForMap={openTasksForMap}
          taskerCategories={taskerCategories}
        />
      </div>
    </DashboardLayout>
  );
}