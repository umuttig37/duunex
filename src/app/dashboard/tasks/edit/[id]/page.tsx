import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TaskEditClientWrapper from './task-edit-client-wrapper';

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const resolvedParams = await params;

  // Check authentication
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profileError || !userProfile) {
    redirect('/login');
  }

  // Fetch task details with all necessary data
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(
      `
      *,
      categories:category_id(id, name_fi, name),
      task_attachments(id, file_url, file_type)
    `
    )
    .eq('id', resolvedParams.id)
    .single();

  if (taskError) {
    console.error('Error fetching task:', taskError);
    redirect('/dashboard?error=task_not_found');
  }

  if (!task) {
    redirect('/dashboard?error=task_not_found');
  }

  // Verify user is the task owner
  if (task.user_id !== currentUser.id) {
    redirect(`/dashboard/tasks/${resolvedParams.id}?error=not_authorized`);
  }

  // Check if task is eligible for editing (open status and no offers)
  const { data: offers, error: offersError } = await supabase
    .from('task_offers')
    .select('id')
    .eq('task_id', resolvedParams.id);

  if (offersError) {
    console.error('Error fetching task offers:', offersError);
  }

  const offersCount = offers?.length || 0;

  // Redirect if task is not eligible for editing
  if (task.status !== 'open' || offersCount > 0) {
    redirect(
      `/dashboard/tasks/${resolvedParams.id}?error=not_editable&status=${task.status}&offers=${offersCount}`
    );
  }

  // Extract coordinates from PostGIS point if available
  let taskLatitude: number | null = null;
  let taskLongitude: number | null = null;

  if (task.location_coordinates) {
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

  // Enhanced task data with coordinates
  const taskWithCoords = {
    ...task,
    latitude: taskLatitude,
    longitude: taskLongitude,
  };

  return (
    <DashboardLayout user={userProfile}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Muokkaa tehtävää
          </h1>
          <p className="text-gray-600">
            Voit muokata tehtävän tietoja niin kauan kuin siihen ei ole saatu tarjouksia.
          </p>
        </div>

        <TaskEditClientWrapper
          task={taskWithCoords}
          currentUser={currentUser}
          userProfile={userProfile}
        />
      </div>
    </DashboardLayout>
  );
}