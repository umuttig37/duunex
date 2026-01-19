'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Approve a tasker application
 */
export async function approveTaskerApplication(applicationId: string) {
  const supabase = await createClient();

  try {
    // Get the application first
    const { data: application, error: fetchError } = await supabase
      .from('tasker_applications')
      .select('profile_id')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error('Application not found');
    }

    // Update application status to approved
    const { error: updateAppError } = await supabase
      .from('tasker_applications')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateAppError) {
      throw updateAppError;
    }

    // Update user profile to verified and change role to tasker
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        is_verified: true,
        role: 'tasker'
      })
      .eq('id', application.profile_id);

    if (updateProfileError) {
      throw updateProfileError;
    }

    revalidatePath('/admin/tasker-applications');
    return { success: true };
  } catch (error) {
    console.error('Error approving tasker application:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Reject a tasker application
 */
export async function rejectTaskerApplication(applicationId: string, reason?: string) {
  const supabase = await createClient();

  try {
    // Update application status to not_approved
    const { error } = await supabase
      .from('tasker_applications')
      .update({ 
        status: 'not_approved',
        reviewed_at: new Date().toISOString(),
        review_notes: reason || null
      })
      .eq('id', applicationId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin/tasker-applications');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting tasker application:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: 'user' | 'tasker' | 'admin') {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Toggle user verification status
 */
export async function toggleUserVerification(userId: string) {
  const supabase = await createClient();

  try {
    // Get current verification status
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      throw new Error('User not found');
    }

    // Toggle verification
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !user.is_verified })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error toggling user verification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new category
 */
export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const nameFi = formData.get('name_fi') as string;
    const slug = formData.get('slug') as string;

    const { error } = await supabase
      .from('categories')
      .insert({
        name,
        name_fi: nameFi,
        description,
        slug,
      });

    if (error) {
      throw error;
    }

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a category (not implemented - would need to check for existing tasks first)
 */
export async function deleteCategory(categoryId: string) {
  // Implement with proper checks for existing tasks to prevent data integrity issues
  return { success: false, error: 'Not implemented - check for existing tasks first' };
}
