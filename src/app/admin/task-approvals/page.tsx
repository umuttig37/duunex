import TaskApprovalManagement from '@/components/features/admin/task-approval-management';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminTaskApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect('/login?message=Please log in to view the admin dashboard.');
  }

  // Fetch the full profile including the role for the admin user
  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // Ensure user is admin
  if (profileError || !adminProfile || adminProfile.role !== 'admin') {
    console.error(
      'Admin Task Approvals Page: Error fetching admin profile or not an admin:',
      profileError,
      adminProfile?.role
    );
    redirect('/?error=admin_access_denied');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Tehtävien hyväksyntä
        </h1>
        <p className="text-gray-600 mt-2">
          Hallitse ja hyväksy käyttäjien lähettämiä tehtäviä
        </p>
      </div>

      <TaskApprovalManagement adminId={adminProfile.id} />
    </div>
  );
}
