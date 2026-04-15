import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackManagement from './feedback-management';

export default async function AdminFeedbackPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Käyttäjäpalautteet</h1>
        <p className="text-gray-600">
          Hallitse Duunex:n käyttäjäpalautteita ja seuraa palvelun kehitystä.
        </p>
      </div>

      <FeedbackManagement />
    </div>
  );
}