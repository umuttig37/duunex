import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface OpenTaskResult {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  created_at: string;
  status: string;
  category_id: string | null;
  user_id: string;
  categories: {
    id: string;
    name_fi: string;
    icon_url: string | null;
    slug: string;
  } | null;
  user_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  existing_offers_count: number;
  distance_meters?: number;
}

// Get open tasks for taskers to browse and bid on
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a tasker
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'tasker') {
      return NextResponse.json(
        { error: 'Tasker access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('categoryId');
    const maxDistance = searchParams.get('maxDistance') ? parseInt(searchParams.get('maxDistance')!) : null;
    const minBudget = searchParams.get('minBudget') ? parseFloat(searchParams.get('minBudget')!) : null;
    const maxBudget = searchParams.get('maxBudget') ? parseFloat(searchParams.get('maxBudget')!) : null;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    // Build base query for open tasks
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        budget,
        location_text,
        latitude,
        longitude,
        scheduled_date,
        scheduled_time_slot,
        created_at,
        status,
        category_id,
        user_id,
        categories!inner(
          id,
          name_fi,
          icon_url,
          slug
        ),
        user_profile:profiles!tasks_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (minBudget !== null) {
      query = query.gte('budget', minBudget);
    }

    if (maxBudget !== null) {
      query = query.lte('budget', maxBudget);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching open tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        tasks: [],
        total: 0,
        hasMore: false
      });
    }

    // Get offer counts for each task
    const taskIds = tasks.map(task => task.id);
    const { data: offerCounts, error: offersError } = await supabase
      .from('task_offers')
      .select('task_id')
      .in('task_id', taskIds)
      .in('status', ['pending', 'awaiting_counter_response']);

    if (offersError) {
      console.error('Error counting offers:', offersError);
    }

    // Count offers per task
    const offerCountMap = new Map<string, number>();
    offerCounts?.forEach(offer => {
      const count = offerCountMap.get(offer.task_id) || 0;
      offerCountMap.set(offer.task_id, count + 1);
    });

    // Calculate distances if location provided (simplified for now)
    const tasksWithDistance: OpenTaskResult[] = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      budget: task.budget,
      location_text: task.location_text,
      latitude: task.latitude,
      longitude: task.longitude,
      scheduled_date: task.scheduled_date,
      scheduled_time_slot: task.scheduled_time_slot,
      created_at: task.created_at,
      status: task.status,
      category_id: task.category_id,
      user_id: task.user_id,
      categories: task.categories,
      user_profile: Array.isArray(task.user_profile) ? task.user_profile[0] : task.user_profile,
      existing_offers_count: offerCountMap.get(task.id) || 0,
      distance_meters: undefined
    }));

    // Note: Distance filtering temporarily disabled - requires custom RPC function
    // Implement find_nearby_tasks RPC function in database for location-based filtering

    // Check if there are more tasks
    const { count, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const total = count || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      tasks: tasksWithDistance,
      total,
      hasMore,
      filters: {
        categoryId,
        maxDistance,
        minBudget,
        maxBudget,
        location: lat && lng ? { lat, lng } : null
      }
    });

  } catch (error) {
    console.error('Open tasks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}