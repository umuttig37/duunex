import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';
import TaskDetailClientWrapper from './task-detail-client-wrapper';

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  // Await both params and searchParams since they're now Promises in Next.js 15
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const { data: userProfile, error: profileError } = currentUser
    ? await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
    : { data: null, error: null };

  // Fetch task details with all necessary fields including assigned_tasker_id
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(
      `
      *,
      categories:category_id(name_fi, name),
      publisher:profiles!tasks_user_id_fkey(first_name, last_name, avatar_url),
      task_attachments(id, file_url, file_type)
    `
    )
    .eq('id', resolvedParams.id)
    .single();

  if (taskError) {
    console.error('Error fetching task:', taskError);
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        Virhe ladattaessa tehtävän tietoja: {taskError.message}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Tehtävää ei löytynyt.
      </div>
    );
  }

  // Extract coordinates from PostGIS point if available
  let taskLatitude: number | null = null;
  let taskLongitude: number | null = null;

  if (task.location_coordinates) {
    // Parse PostGIS POINT format: "SRID=4326;POINT(longitude latitude)"
    const coordString = task.location_coordinates as string;
    const pointMatch = coordString.match(/POINT\(([^)]+)\)/);
    if (pointMatch) {
      const coords = pointMatch[1].split(' ');
      if (coords.length === 2) {
        taskLongitude = parseFloat(coords[0]);
        taskLatitude = parseFloat(coords[1]);
      }
    }
  }

  // Fetch all offers for this task to check if the current tasker has already made one
  const { data: offers, error: offersError } = await supabase
    .from('task_offers')
    .select('tasker_id, offered_price, status')
    .eq('task_id', resolvedParams.id);

  if (offersError) {
    console.error('Error fetching task offers:', offersError);
    // Non-critical error, we can proceed but log it.
  }

  // Define a type for the offer object
  type Offer = {
    tasker_id: string;
    offered_price: number;
    status: string;
  };

  // Find the accepted offer to get the final agreed price
  const acceptedOffer = offers?.find(
    (offer: Offer) => offer.status === 'accepted'
  );
  const finalPrice = acceptedOffer?.offered_price || task.budget;

  // Fetch assigned tasker details if task is assigned, awaiting payment, paid, or has a request sent
  let assignedTasker = null;
  if ((task.status === 'assigned' || task.status === 'awaiting_payment' || task.status === 'paid' || task.status === 'request_sent') && task.assigned_tasker_id) {
    const { data: taskerData, error: taskerError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, bio')
      .eq('id', task.assigned_tasker_id)
      .single();

    if (taskerError) {
      console.error('Error fetching assigned tasker:', taskerError);
    } else {
      assignedTasker = taskerData;
    }
  }

  const isTaskOwner = currentUser?.id === task.user_id;

  // Fetch user's review for this task if task is completed
  let userReview = null;
  if (
    (task.status === 'completed' || task.status === 'early_completed') &&
    currentUser &&
    isTaskOwner &&
    task.assigned_tasker_id
  ) {
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('task_id', resolvedParams.id)
      .eq('reviewer_profile_id', currentUser.id)
      .eq('reviewee_profile_id', task.assigned_tasker_id)
      .single();

    if (reviewError && reviewError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching user review:', reviewError);
    } else if (reviewData) {
      userReview = reviewData;
    }
  }

  // --- Render Page ---
  return (
    <DashboardLayout user={userProfile}>
      <TaskDetailClientWrapper
        task={task}
        assignedTasker={assignedTasker}
        offers={offers}
        currentUser={currentUser}
        userProfile={userProfile}
        userReview={userReview}
        taskId={resolvedParams.id}
        searchParams={resolvedSearchParams}
      />
    </DashboardLayout>
  );
}
