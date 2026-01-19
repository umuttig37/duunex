import { redirect } from 'next/navigation';

import TaskRequestsList from '@/components/features/tasks/task-requests-list';
import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';

export default async function TaskRequestsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get user profile and check if they are a tasker
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login');
  }

  // Only taskers can access this page
  if (profile.role !== 'tasker') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={profile}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tehtäväpyynnöt</h1>
          <p className="text-gray-600 mt-2">
            Tässä näkyvät sinulle lähetetyt tehtäväpyynnöt, jotka odottavat vastaustasi.
          </p>
        </header>

        <TaskRequestsList taskerId={user.id} />
      </div>
    </DashboardLayout>
  );
} 