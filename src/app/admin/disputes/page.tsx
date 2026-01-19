import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DisputeManagement from './dispute-management';

export default async function DisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // TODO: Implement task_disputes table in database schema
  // For now, return empty disputes array to prevent TypeScript errors
  const disputes: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riitojen hallinta</h1>
        <p className="mt-1 text-gray-600">
          Hallitse tehtäväriitojen ratkaisuprosessia ja palautusmenettelyjä.
        </p>
        <p className="mt-2 text-sm text-yellow-600">
          Huomio: Riitataulukko ei ole vielä toteutettu tietokannassa.
        </p>
      </div>

      <DisputeManagement disputes={disputes} />
    </div>
  );
}