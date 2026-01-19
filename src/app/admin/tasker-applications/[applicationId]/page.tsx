import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TaskerApplicationDetailClient from './tasker-application-detail-client';

export const dynamic = 'force-dynamic';

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type TaskerApplication =
  Database['public']['Tables']['tasker_applications']['Row'];
type TaskerDetails = Database['public']['Tables']['tasker_details']['Row'];

interface ExtendedTaskerApplicationWithDetails extends TaskerApplication {
  profile: UserProfile | null;
  tasker_details: TaskerDetails | null;
}

async function getAdminProfile(
  supabase: SupabaseClient<Database>
): Promise<UserProfile | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) redirect('/login?message=Please log in.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (profileError || !profile || profile.role !== 'admin') return null;
  return profile;
}

async function getTaskerApplicationDetails(
  supabase: SupabaseClient<Database>,
  applicationId: string
): Promise<ExtendedTaskerApplicationWithDetails | null> {
  const { data: application, error: appError } = await supabase
    .from('tasker_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    console.error('Error fetching application:', appError);
    return null;
  }

  // Fetch the associated profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', application.profile_id)
    .single();

  if (profileError) {
    console.error('Error fetching profile for application:', profileError);
    // Decide if you want to return the application without profile or null
  }

  // Fetch tasker_details if profile exists
  let taskerDetails: TaskerDetails | null = null;
  if (profile) {
    const { data: details, error: detailsError } = await supabase
      .from('tasker_details')
      .select('*')
      .eq('profile_id', profile.id)
      .single();
    if (detailsError) {
      console.warn(
        'Could not fetch tasker_details for profile:',
        profile.id,
        detailsError.message
      );
      // Not a critical error, proceed without tasker_details if not found
    }
    taskerDetails = details;
  }

  return {
    ...application,
    profile: profile || null,
    tasker_details: taskerDetails,
  } as ExtendedTaskerApplicationWithDetails;
}

interface PageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default async function TaskerApplicationDetailPage({
  params,
}: PageProps) {
  const supabase = await createClient();
  const { applicationId } = await params;

  const adminProfile = await getAdminProfile(supabase);
  if (!adminProfile) {
    redirect('/?error=admin_access_denied_page');
  }

  const applicationDetails = await getTaskerApplicationDetails(
    supabase,
    applicationId
  );

  if (!applicationDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 text-destructive" /> Hakemusta Ei
            Löytynyt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Valittua tekijähakemusta ei löytynyt tai sen tietoja ei voitu
            ladata.
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/tasker-applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Palaa listaukseen
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TaskerApplicationDetailClient
      application={applicationDetails}
      applicantProfile={applicationDetails.profile}
      taskerSpecificDetails={applicationDetails.tasker_details}
      adminUserId={adminProfile.id}
    />
  );
}
