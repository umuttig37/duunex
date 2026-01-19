import AdminLayout from '@/components/shared/layout/admin_layout';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Middleware should already protect this page for non-admins.
  // But as a safeguard, or if middleware is bypassed/fails, check role again.
  if (profileError || !adminProfile || adminProfile.role !== 'admin') {
    console.error(
      'Admin Layout: Error fetching admin profile or not an admin:',
      profileError,
      adminProfile?.role
    );
    redirect('/?error=admin_access_denied');
  }

  return <AdminLayout user={adminProfile}>{children}</AdminLayout>;
}
