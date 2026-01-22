import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import DashboardClientContent from './dashboard_client_content';

export const dynamic = 'force-dynamic';

export type DashboardTask = Database['public']['Tables']['tasks']['Row'] & {
  categories?: Pick<
    Database['public']['Tables']['categories']['Row'],
    'name_fi' | 'icon_url'
  > | null;
  assigned_tasker_profile?: Pick<
    Database['public']['Tables']['profiles']['Row'],
    'id' | 'first_name' | 'last_name' | 'avatar_url'
  > | null;
  user_profile?: Pick<
    Database['public']['Tables']['profiles']['Row'],
    'id' | 'first_name' | 'last_name' | 'avatar_url'
  > | null;
  task_attachments?:
    | Pick<
        Database['public']['Tables']['task_attachments']['Row'],
        'id' | 'file_url' | 'file_type'
      >[]
    | null;
  offers_count?: number;
  message_count?: number;
  user_review?: Pick<
    Database['public']['Tables']['reviews']['Row'],
    'id' | 'rating' | 'comment'
  > | null;
  accepted_offer?: Pick<
    Database['public']['Tables']['task_offers']['Row'],
    'id' | 'status' | 'offered_price' | 'is_counter_offer'
  > | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?message=Please log in to view your dashboard.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Dashboard: Error fetching profile:', profileError);
    const errorProfile = {
      id: user?.id || '',
      role: '',
      first_name: null,
      last_name: null,
      avatar_url: null,
      phone_number: null,
      bio: null,
      is_verified: false,
      created_at: new Date().toISOString(),
      address: null,
      city: null,
      zipcode: null,
      email: user?.email || null,
    } as Database['public']['Tables']['profiles']['Row'];

    return (
      <DashboardLayout user={profileError ? errorProfile : profile}>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2" /> Virhe Profiilin Latauksessa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Profiilitietojen lataaminen epäonnistui. Yritä myöhemmin
                uudelleen.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Virhe: {profileError?.message || 'Tuntematon virhe'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // IMPORTANT: Redirect admin users to admin dashboard
  if (profile.role === 'admin') {
    redirect('/admin?message=Ohjattiin admin-hallintapaneeliin.');
  }

  let tasks: DashboardTask[] = [];
  let openTasksForMap: DashboardTask[] = [];
  let fetchError: string | null = null;
  let openTasksError: string | null = null;

  // Helper function to count only valid (non-declined/withdrawn) offers
  const getValidOffersCount = (offers: any[]) => {
    return (
      offers?.filter((offer) =>
        [
          'pending',
          'accepted',
          'counter_offered',
          'awaiting_counter_response',
        ].includes(offer.status)
      ).length || 0
    );
  };

  if (profile.role === 'user') {
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        categories (name_fi, icon_url),
        assigned_tasker_profile:profiles!tasks_assigned_tasker_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        task_attachments (id, file_url, file_type),
        task_offers (id, status, offered_price, is_counter_offer, tasker_id)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) fetchError = error.message;

    // Fetch user's reviews for their tasks
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, task_id')
      .eq('reviewer_profile_id', user.id);

    const reviewsMap = new Map(
      reviewsData?.map((review) => [review.task_id, review]) || []
    );

    // Map data to include offers count, user review, and accepted offer info
    tasks = data
      ? data.map((task) => ({
          ...task,
          offers_count: getValidOffersCount(task.task_offers || []),
          user_review: reviewsMap.get(task.id) || null,
          accepted_offer:
            task.task_offers?.find(
              (offer) =>
                offer.status === 'accepted' &&
                offer.tasker_id === task.assigned_tasker_id
            ) || null,
        }))
      : [];
  } else if (profile.role === 'tasker') {
    const { data: assignedData, error: assignedError } = await supabase
      .from('tasks')
      .select(
        `
        *,
        categories (name_fi, icon_url),
        user_profile:profiles!tasks_user_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        task_attachments (id, file_url, file_type),
        task_offers (id, status, offered_price, is_counter_offer, tasker_id)
      `
      )
      .eq('assigned_tasker_id', user.id)
      .order('created_at', { ascending: false });
    if (assignedError) fetchError = assignedError.message;

    // Map data to include offers count and accepted offer info
    tasks = assignedData
      ? assignedData.map((task) => ({
          ...task,
          offers_count: getValidOffersCount(task.task_offers || []),
          accepted_offer:
            task.task_offers?.find(
              (offer) =>
                offer.tasker_id === user.id && offer.status === 'accepted'
            ) || null,
        }))
      : [];

    // Fetch all open tasks with location for the map view using RPC
    const { data: rpcOpenData, error: rpcOpenError } = await supabase.rpc(
      'get_open_tasks_for_map'
    );

    if (rpcOpenError) {
      console.error(
        'Dashboard: Error fetching open tasks via RPC:',
        rpcOpenError
      );
      openTasksError = rpcOpenError.message;
      openTasksForMap = [];
    } else {
      // Manually map the RPC result to the DashboardTask structure
      openTasksForMap = rpcOpenData
        ? rpcOpenData.map((task) => ({
            // Required fields from tasks table that match RPC return
            id: task.id,
            title: task.title,
            description: task.description,
            location_text: task.location_text,
            status: task.status,
            created_at: task.created_at,
            scheduled_date: task.scheduled_date,
            scheduled_time_slot: task.scheduled_time_slot,
            budget: task.budget,
            category_id: task.category_id,
            user_id: task.user_id,

            // Fields that RPC doesn't return but DashboardTask expects (set defaults)
            assigned_tasker_id: null,
            image_url: null, // RPC doesn't return image URLs for map view
            latitude: null, // RPC doesn't return latitude
            longitude: null, // RPC doesn't return longitude
            location_coordinates: task.location_coordinates,
            posting_type: null,
            updated_at: task.created_at, // Use created_at as fallback

            // Nested structures
            categories: task.category_name_fi
              ? {
                  name_fi: task.category_name_fi,
                  icon_url: null, // RPC doesn't return category icon_url
                }
              : null,
            user_profile: task.user_profile_id
              ? {
                  id: task.user_profile_id,
                  first_name: task.user_first_name,
                  last_name: task.user_last_name,
                  avatar_url: null, // TODO: Add avatar_url to RPC result
                }
              : null,
            task_attachments: null, // RPC doesn't return task attachments for map view
          }))
        : [];
    }
  }

  if (fetchError) {
    console.error('Dashboard: Error fetching tasks:', fetchError);
  }

  return (
    <DashboardLayout user={profile}>
      <div className="min-h-screen bg-gray-50/30">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300">
          <Suspense fallback={<DashboardLoadingFallback />}>
            <DashboardClientContent
              user={profile}
              tasks={tasks}
              openTasksForMap={openTasksForMap}
              currentUserId={profile.id}
            />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Basic fallback component for dashboard content
function DashboardLoadingFallback() {
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="flex flex-col items-center">
        {/* You can use a spinner or any loading indicator from your UI library */}
        <svg
          className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-4 text-lg text-gray-600">Ladataan työpöytää...</p>
      </div>
    </div>
  );
}
