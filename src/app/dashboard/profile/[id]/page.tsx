import DashboardLayout from '@/components/shared/layout/dashboard_layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateProfileAction, updateUserPreferencesAction } from '../actions';
import UnifiedProfileClient from './unified-profile-client';

export default async function ProfilePage({
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

  if (!currentUser) {
    redirect('/login');
  }

  // Get the current user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    redirect('/dashboard');
  }

  // Check if the user is trying to access their own profile or is an admin
  const profileId = resolvedParams.id;
  const isOwnProfile = currentUser.id === profileId;
  const isAdmin = profile.role === 'admin';

  if (!isOwnProfile && !isAdmin) {
    redirect('/dashboard');
  }

  // Get the profile being viewed (could be same as current user or different if admin)
  const { data: viewedProfile, error: viewedProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (viewedProfileError || !viewedProfile) {
    console.error('Error fetching viewed profile:', viewedProfileError);
    redirect('/dashboard');
  }

  // Fetch all categories for taskers
  let allCategories: any[] = [];
  if (viewedProfile.role === 'tasker') {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name_fi, slug')
      .order('name_fi');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    } else {
      allCategories = categoriesData || [];
    }
  }

  // Fetch tasker's current categories and details
  let currentCategories: string[] = [];
  let taskerDetails = null;
  if (viewedProfile.role === 'tasker') {
    console.log('Fetching tasker categories for profile:', profileId);
    const { data: taskerCatsData, error: taskerCatsError } = await supabase
      .from('tasker_categories')
      .select('category_id')
      .eq('profile_id', profileId);

    if (taskerCatsError) {
      console.error('Error fetching tasker categories:', taskerCatsError);
    } else {
      currentCategories = taskerCatsData?.map(tc => tc.category_id) || [];
      console.log('Fetched current categories:', currentCategories);
    }

    // Fetch tasker details (hourly rate, service radius, etc.)
    const { data: taskerDetailsData, error: taskerDetailsError } = await supabase
      .from('tasker_details')
      .select('hourly_rate, service_radius_meters')
      .eq('profile_id', profileId)
      .single();

    if (taskerDetailsError) {
      console.log('No tasker details found, will use defaults:', taskerDetailsError);
    } else {
      taskerDetails = taskerDetailsData;
    }
  }

  return (
    <DashboardLayout user={profile}>
      <UnifiedProfileClient 
        viewedProfile={viewedProfile}
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
        isAdmin={isAdmin}
        allCategories={allCategories}
        currentCategories={currentCategories}
        taskerDetails={taskerDetails}
        updateProfileAction={updateProfileAction}
        updateUserPreferencesAction={updateUserPreferencesAction}
        activeTab={(resolvedSearchParams.tab as string) || 'general'}
      />
    </DashboardLayout>
  );
}