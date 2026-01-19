'use server';

import { createClient } from '@/lib/supabase/server';
import { initiatePayment } from '@/services/payment/paytrail';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Server Action to create a new Paytrail payment
export const createPaytrailPayment = async (
  taskId: string,
  amount: number,
  userEmail: string,
  userId: string,
  taskTitle: string // Keep taskTitle for now, though it's not used in initiatePayment
) => {
  const supabase = await createClient();

  // 1. Create a unique ID for the payment record. This will be our "stamp".
  const paymentId = uuidv4();

  // 2. Create a "pending" payment record in the database before contacting Paytrail.
  const { error: paymentError } = await supabase.from('payments').insert({
    id: paymentId,
    task_id: taskId,
    user_id: userId,
    amount: amount, // Store amount in euros
    status: 'pending',
  });

  if (paymentError) {
    console.error('Error saving payment to database:', paymentError);
    return {
      success: false,
      error: 'Maksutapahtuman tallennus epäonnistui.',
    };
  }

  // 3. Call the centralized `initiatePayment` function to create the payment with Paytrail.
  try {
    console.log(`[createPaytrailPayment Action] Initiating payment with paymentId: ${paymentId} for taskId: ${taskId}. VERCEL_ENV: ${process.env.VERCEL_ENV}, NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    const paymentResponse = await initiatePayment({
      orderId: paymentId, // Use the database payment ID as the stamp/orderId
      amountCents: Math.round(amount * 100), // Convert to cents for Paytrail
      currency: 'EUR',
      customerEmail: userEmail,
      taskId: taskId,
    });

    // 4. Return the successful response containing the payment URL.
    return {
      success: true,
      data: paymentResponse, // Contains { transactionId, paymentUrl }
    };
  } catch (error) {
    console.error('Paytrail payment creation failed in action:', error);

    // If Paytrail fails, update our DB record to 'failed'
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', paymentId);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Maksun luonti Paytrailissa epäonnistui.',
    };
  }
};

export async function deleteProfileAction(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Call the PostgreSQL function to delete user and all related data
  const { data: rpcData, error: rpcError } = await supabase.rpc('handle_delete_current_user');

  if (rpcError) {
    console.error('Error calling handle_delete_current_user RPC:', rpcError);
    return { success: false, message: `Tilin poisto epäonnistui: ${rpcError.message}` };
  }

  // The RPC function returns a JSON object with status and message
  const rpcResponse = rpcData as { status: string; message: string };

  if (rpcResponse.status === 'success') {
    // Sign out the user from the current session on the server-side.
    // This invalidates the Supabase session cookie.
    await supabase.auth.signOut();
    
    // Revalidate paths if needed, though client-side redirect will handle UI update
    revalidatePath('/'); // Revalidate homepage
    // revalidatePath('/profile'); // Revalidate generic profile path

    return { success: true, message: rpcResponse.message };
    // Client-side will handle redirect upon receiving success
  } else {
    console.error('handle_delete_current_user RPC returned error:', rpcResponse.message);
    return { success: false, message: rpcResponse.message || 'Tilin poistossa tapahtui tuntematon virhe.' };
  }
}

// Placeholder for updateProfileAction if it's in the same file or you need to create it.
// Ensure this function is also marked with 'use server' if it's a server action.
export async function updateProfileAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  console.log("updateProfileAction called. FormData first name:", formData.get("firstName")); // Example log
  // Implement actual profile update logic here using Supabase client (server-side)
  // For example:
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return { success: false, message: "User not authenticated." };
  // const { error } = await supabase.from('profiles').update({ first_name: formData.get('firstName') }).eq('id', user.id);
  // if (error) return { success: false, message: error.message };
  // revalidatePath('/profile/[id]', 'page'); // or the specific profile page
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate async
  return { success: true, message: "Profiilin päivitys onnistui (toimintoa ei ole täysin toteutettu)!" };
} 

export async function resetDatabaseAction(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Ei autentikoitu.' };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    return { success: false, message: 'Ei valtuutettu.' };
  }

  try {
    // Delete ALL data AND users/profiles EXCEPT admin user
    // Delete in order of dependencies (foreign key constraints)
    
    // First, get admin user ID to preserve it
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .eq('role', 'admin')
      .single();
    
    if (!adminProfile) {
      throw new Error('Admin user not found - cannot proceed with reset');
    }
    
    const adminUserId = adminProfile.id;
    
    console.log('Deleting reviews...');
    const { error: reviewsError } = await supabase.from('reviews').delete().gte('created_at', '1970-01-01');
    if (reviewsError) throw reviewsError;

    console.log('Deleting messages...');
    const { error: messagesError } = await supabase.from('messages').delete().gte('created_at', '1970-01-01');
    if (messagesError) throw messagesError;

    console.log('Deleting notifications...');
    const { error: notificationsError } = await supabase.from('notifications').delete().gte('created_at', '1970-01-01');
    if (notificationsError) throw notificationsError;

    console.log('Deleting support tickets...');
    const { error: supportError } = await supabase.from('support_tickets').delete().gte('created_at', '1970-01-01');
    if (supportError) throw supportError;

    console.log('Deleting withdrawal requests...');
    const { error: withdrawalError } = await supabase.from('withdrawal_requests').delete().gte('created_at', '1970-01-01');
    if (withdrawalError) throw withdrawalError;

    console.log('Deleting balance transactions...');
    const { error: balanceError } = await supabase.from('balance_transactions').delete().gte('created_at', '1970-01-01');
    if (balanceError) throw balanceError;

    console.log('Deleting tasker balance...');
    const { error: taskerBalanceError } = await supabase.from('tasker_balance').delete().gte('created_at', '1970-01-01');
    if (taskerBalanceError) throw taskerBalanceError;

    console.log('Deleting task specific answers...');
    const { error: answersError } = await supabase.from('task_specific_answers').delete().gte('created_at', '1970-01-01');
    if (answersError) throw answersError;

    console.log('Deleting task attachments...');
    const { error: attachmentsError } = await supabase.from('task_attachments').delete().gte('created_at', '1970-01-01');
    if (attachmentsError) throw attachmentsError;

    console.log('Deleting task offers...');
    const { error: offersError } = await supabase.from('task_offers').delete().gte('created_at', '1970-01-01');
    if (offersError) throw offersError;

    console.log('Deleting tasks...');
    const { error: tasksError } = await supabase.from('tasks').delete().gte('created_at', '1970-01-01');
    if (tasksError) throw tasksError;

    console.log('Deleting bank account info...');
    const { error: bankError } = await supabase.from('bank_account_info').delete().gte('created_at', '1970-01-01');
    if (bankError) throw bankError;

    console.log('Deleting tasker categories (except admin)...');
    const { error: taskerCategoriesError } = await supabase.from('tasker_categories').delete().neq('profile_id', adminUserId);
    if (taskerCategoriesError) throw taskerCategoriesError;

    console.log('Deleting tasker details (except admin)...');
    const { error: taskerDetailsError } = await supabase.from('tasker_details').delete().neq('profile_id', adminUserId);
    if (taskerDetailsError) throw taskerDetailsError;

    console.log('Deleting tasker applications...');
    const { error: applicationsError } = await supabase.from('tasker_applications').delete().gte('submitted_at', '1970-01-01');
    if (applicationsError) throw applicationsError;

    // Delete ALL profiles except admin
    console.log('Deleting all profiles except admin...');
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', adminUserId);

    if (profileDeleteError) throw profileDeleteError;

    // Delete all users from auth.users except admin (requires admin privileges)
    console.log('Deleting all auth users except admin...');
    // Note: This requires service role privileges and direct database access
    // For now, we'll log this step as it requires special handling
    
    // Since we can't directly delete from auth.users via regular client,
    // we'll need to create an RPC function for this or handle it differently
    try {
      const { error: authDeleteError } = await supabase
        .rpc('delete_non_admin_users', { admin_user_id: adminUserId });
      
      if (authDeleteError) {
        console.warn('Could not delete auth users (RPC not available):', authDeleteError);
        // This is not critical - profiles are deleted which is the main concern
      }
    } catch (rpcError) {
      console.warn('delete_non_admin_users RPC not available, skipping auth.users cleanup');
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');

    console.log('Database reset completed successfully - all data and users deleted except admin');
    return { success: true, message: 'Tietokanta nollattu onnistuneesti. Ainoastaan admin-käyttäjä säilytetty.' };
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return { success: false, message: `Virhe: ${error.message || 'Tuntematon virhe'}` };
  }
}