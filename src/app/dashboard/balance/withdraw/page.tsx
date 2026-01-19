import WithdrawalRequestForm from '@/components/features/balance/withdrawal-request-form';
import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function WithdrawPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?message=Please log in to access withdrawal features.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/dashboard?error=Profile not found');
  }

  // Only taskers can access withdrawal features
  if (profile.role !== 'tasker') {
    redirect('/dashboard?error=Access denied - taskers only');
  }

  return (
    <DashboardLayout user={profile}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin työpöydälle
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nostopyyntö
          </h1>
          <p className="text-gray-600">
            Nosta ansaitsemasi rahat pankkitilillesi
          </p>
        </div>

        <WithdrawalRequestForm userId={user.id} />
      </div>
    </DashboardLayout>
  );
} 