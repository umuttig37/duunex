'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define the schema for form data validation
const UpdateApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  profileId: z.string().uuid(),
  newStatus: z.enum(['pending', 'approved', 'not_approved']),
  reviewNotes: z.string().optional(),
  adminUserId: z.string().uuid(),
});

interface ActionResult {
  success: boolean;
  message?: string;
}

export async function updateTaskerApplicationAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // Validate admin user (ensure they are an admin before proceeding)
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { success: false, message: 'Authentication required.' };
  }
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (adminProfileError || !adminProfile || adminProfile.role !== 'admin') {
    return { success: false, message: 'Unauthorized: Admin role required.' };
  }

  const validatedFields = UpdateApplicationSchema.safeParse({
    applicationId: formData.get('applicationId'),
    profileId: formData.get('profileId'),
    newStatus: formData.get('newStatus'),
    reviewNotes: formData.get('reviewNotes'),
    adminUserId: formData.get('adminUserId'), // This is the admin performing the action
  });

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Invalid form data. " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { applicationId, profileId, newStatus, reviewNotes, adminUserId } = validatedFields.data;

  try {
    // Update the tasker_applications table
    const { error: applicationUpdateError } = await supabase
      .from('tasker_applications')
      .update({
        status: newStatus,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq('id', applicationId);

    if (applicationUpdateError) {
      console.error('Error updating tasker_applications:', applicationUpdateError);
      return { success: false, message: `Database error updating application: ${applicationUpdateError.message}` };
    }

    // If status is 'approved', update profiles.is_verified to true
    // If status is changed from 'approved' to something else, set is_verified to false
    // To do this safely, we need to know the *previous* status or just set it based on the new one.
    // For simplicity, we will set is_verified based directly on the newStatus.
    let newVerificationStatus = false;
    if (newStatus === 'approved') {
      newVerificationStatus = true;
    }
    
    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ is_verified: newVerificationStatus })
        .eq('id', profileId);

    if (profileUpdateError) {
        console.error('Error updating profile is_verified status:', profileUpdateError);
        // This is a secondary error; the application itself might have been updated.
        // Decide on atomicity or error handling strategy here.
        // For now, we'll report success but log this error.
        // Consider transactions for Supabase if this needs to be atomic.
        return { success: false, message: `Application updated, but profile verification status failed to update: ${profileUpdateError.message}` };
    }

    // Revalidate paths to ensure data is fresh
    revalidatePath('/admin/tasker-applications');
    revalidatePath(`/admin/tasker-applications/${applicationId}`);

    return { success: true, message: 'Hakemus päivitetty onnistuneesti.' };

  } catch (e: any) {
    console.error('Unexpected error in server action:', e);
    return { success: false, message: `An unexpected error occurred: ${e.message}` };
  }
} 