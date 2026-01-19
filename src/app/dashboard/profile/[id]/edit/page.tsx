import { redirect } from 'next/navigation';

export default async function EditProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Redirect to the unified profile page with general tab active
  redirect(`/dashboard/profile/${id}?tab=general`);
}