'use server';

import { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { sendEarlyCompletionRequestedEmail } from '@/services/notifications/email-service';
import { initiatePayment } from '@/services/payment/paytrail';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// Import schema and state type from the new schema file
import { TaskFormState, TaskSchema } from '@/app/dashboard/tasks/schema';

// Remove TaskSchema and TaskFormState exports from here
// export const TaskSchema = z.object({ ... });
// export type TaskFormState = { ... };

export async function createTask(prevState: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Use more specific error key
    return { message: 'Authentication error. Please log in again.', errors: { auth: ['Authentication required.'] }, success: false };
  }

  // Ensure image_urls is always an array of strings
  let imageUrls: string[] = [];
  if (formData.has('image_urls')) {
    const raw = formData.getAll('image_urls');
    imageUrls = raw.flatMap((v) => (typeof v === 'string' ? [v] : []));
  }

  // Validate form data using the imported schema
  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    location_text: formData.get('location_text'),
    budget: formData.get('budget'),
    dueDate: formData.get('dueDate') || undefined,
    latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
    longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
    image_urls: imageUrls,
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // Destructure validated data
  const { title, description, categoryId, location_text, budget, dueDate, latitude, longitude, image_urls } = validatedFields.data;

  // Prepare data for Supabase insertion
  const taskData: Omit<Database['public']['Tables']['tasks']['Insert'], 'id' | 'created_at' | 'updated_at'> = {
    user_id: user.id,
    category_id: categoryId,
    title,
    description,
    location_text, // Use location_text for the text field
    budget,
    scheduled_date: dueDate || null, // Changed from due_date to scheduled_date
    location_coordinates: latitude != null && longitude != null ? `SRID=4326;POINT(${longitude} ${latitude})` : null,
    status: 'open', // Set initial status as required by blueprint
  };

  // Insert the task and get the new task's ID
  const { data: insertedTasks, error: insertError } = await supabase.from('tasks').insert(taskData).select('id');

  if (insertError || !insertedTasks || insertedTasks.length === 0) {
    console.error("Supabase Insert Error:", insertError);
    return {
      message: `Database Error: Failed to create task.`,
      errors: { database: [insertError?.message || 'Task insert failed'] },
      success: false,
    };
  }

  const taskId = insertedTasks[0].id;

  // Insert attachments if any
  if (imageUrls.length > 0) {
    const attachments: Database['public']['Tables']['task_attachments']['Insert'][] = imageUrls.map((url: string) => ({
      task_id: taskId,
      file_url: url,
      file_type: 'image',
    }));
    const { error: attachmentError } = await supabase.from('task_attachments').insert(attachments);    if (attachmentError) {
      console.error('Attachment Insert Error:', attachmentError, attachments);
      // Return a warning to the user if attachments fail
      return {
        message: `Tehtävä luotiin, mutta liitteiden tallennus epäonnistui: ${attachmentError.message}`,
        errors: { database: [attachmentError.message] },
        success: false,
      };
    }
  }

  // Revalidate paths
  revalidatePath('/dashboard/tasks');
  revalidatePath('/');

  // Redirect on success
  redirect('/dashboard/tasks?message=Task created successfully!');
  // Note: The redirect means the success state below might not be reached by the client,
  // but it's good practice to return a consistent state object.
  // return { message: 'Task created successfully!', success: true };
}

interface ActionResult {
  success: boolean;
  message: string;
  error?: any;
}

export async function acceptTaskRequest(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Find the pending task offer for this tasker
  const { data: taskOffer, error: offerError } = await supabase
    .from('task_offers')
    .select('id, task_id, tasker_id, status')
    .eq('task_id', taskId)
    .eq('tasker_id', user.id)
    .eq('status', 'pending')
    .single();

  if (offerError || !taskOffer) {
    console.error('Error fetching task offer or offer not found:', offerError);
    return { success: false, message: 'Tehtäväpyyntöä ei löytynyt tai se ei ole sinulle tarkoitettu.' };
  }

  // Accept the task offer
  const { error: acceptError } = await supabase
    .from('task_offers')
    .update({ status: 'accepted' })
    .eq('id', taskOffer.id);

  if (acceptError) {
    console.error('Error accepting task offer:', acceptError);
    return { success: false, message: `Tehtäväpyynnön hyväksyminen epäonnistui: ${acceptError.message}` };
  }

  // Update the task to assign it to this tasker and set status to 'awaiting_payment'
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ 
      assigned_tasker_id: user.id,
      status: 'awaiting_payment' // Set proper status to indicate payment is required
    })
    .eq('id', taskId);

  if (updateError) {
    console.error('Error updating task assignment:', updateError);
    // Rollback the offer acceptance
    await supabase
      .from('task_offers')
      .update({ status: 'pending' })
      .eq('id', taskOffer.id);
    return { success: false, message: `Tehtävän määritys epäonnistui: ${updateError.message}` };
  }

  // Decline any other pending offers for this task
  const { error: declineOthersError } = await supabase
    .from('task_offers')
    .update({ status: 'declined' })
    .eq('task_id', taskId)
    .neq('id', taskOffer.id)
    .eq('status', 'pending');

  if (declineOthersError) {
    console.warn('Warning: Could not decline other offers:', declineOthersError);
    // Don't fail the operation for this
  }

  revalidatePath('/dashboard'); 
  revalidatePath('/dashboard/task-requests');
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath(`/messages?taskId=${taskId}`);

  return { 
    success: true, 
    message: 'Tehtäväpyyntö hyväksytty! Asiakas saa ilmoituksen ja maksulinkin. Chat avataan maksamisen jälkeen.' 
  };
}

export async function declineTaskRequest(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Find the pending task offer for this tasker
  const { data: taskOffer, error: offerError } = await supabase
    .from('task_offers')
    .select('id, task_id, tasker_id, status')
    .eq('task_id', taskId)
    .eq('tasker_id', user.id)
    .eq('status', 'pending')
    .single();

  if (offerError || !taskOffer) {
    console.error('Error fetching task offer or offer not found:', offerError);
    return { success: false, message: 'Tehtäväpyyntöä ei löytynyt tai se ei ole sinulle tarkoitettu.' };
  }

  // Decline the task offer
  const { error: declineError } = await supabase
    .from('task_offers')
    .update({ status: 'declined' })
    .eq('id', taskOffer.id);

  if (declineError) {
    console.error('Error declining task offer:', declineError);
    return { success: false, message: `Tehtäväpyynnön hylkääminen epäonnistui: ${declineError.message}` };
  }

  // Check if this was a direct request - if so, reset task status to allow re-selection
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('status, posting_type')
    .eq('id', taskId)
    .single();

  if (!taskError && task && task.status === 'request_sent') {
    // Reset direct request task status to allow user to select another tasker
    await supabase
      .from('tasks')
      .update({ status: 'open' })
      .eq('id', taskId);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/task-requests');
  revalidatePath(`/dashboard/tasks/${taskId}`);

  return { success: true, message: 'Tehtäväpyyntö hylätty onnistuneesti.' };
}

// Task Offers Actions

export async function createTaskOffer(prevState: any, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient(); // Removed cookieStore argument
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  const taskId = formData.get('taskId') as string;
  const offeredPrice = parseFloat(formData.get('offeredPrice') as string);
  const message = formData.get('message') as string;
  const proposedDate = formData.get('proposedDate') as string;
  const proposedTimeSlot = formData.get('proposedTimeSlot') as string;

  // Validate inputs
  if (!taskId || !offeredPrice || offeredPrice <= 0) {
    return { success: false, message: 'Tehtävä-ID ja tarjoushinta ovat pakollisia.' };
  }

  // Check if task exists and is open
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, user_id')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return { success: false, message: 'Tehtävää ei löytynyt.' };
  }

  if (task.status !== 'open') {
    return { success: false, message: 'Tehtävä ei ole enää avoin tarjouksille.' };
  }

  if (task.user_id === user.id) {
    return { success: false, message: 'Et voi tehdä tarjousta omaan tehtävääsi.' };
  }

  // Check if user is a verified tasker
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'tasker') {
    return { success: false, message: 'Vain taskerit voivat tehdä tarjouksia.' };
  }

  if (!profile.is_verified) {
    return { success: false, message: 'Sinun täytyy olla varmennettu tasker tehdäksesi tarjouksia.' };
  }

  // Insert the offer
  const { error: insertError } = await supabase
    .from('task_offers')
    .insert({
      task_id: taskId,
      tasker_id: user.id,
      offered_price: offeredPrice,
      message: message || null,
      proposed_date: proposedDate || null,
      proposed_time_slot: proposedTimeSlot || null,
    });

  if (insertError) {
    if (insertError.code === '23505') { // Unique constraint violation
      return { success: false, message: 'Olet jo tehnyt tarjouksen tähän tehtävään.' };
    }
    console.error('Error creating task offer:', insertError);
    return { success: false, message: `Tarjouksen luominen epäonnistui: ${insertError.message}` };
  }

  // Create notification for task owner about new offer
  try {
    await supabase.from('notifications').insert({
      recipient_id: task.user_id,
      type: 'new_task_offer',
      title: 'Uusi tarjous tehtävään',
      message: `Sait uuden tarjouksen tehtävään. Tarjous: ${offeredPrice}€`,
      link: `/dashboard/tasks/${taskId}#offers`,
      is_read: false
    });
    console.log(`✅ Notification sent to task owner: ${task.user_id}`);
  } catch (notificationError) {
    console.error('Error creating notification:', notificationError);
    // Don't fail the whole operation for notification error
  }

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath('/dashboard/user');
  revalidatePath('/dashboard/tasker');

  return { success: true, message: 'Tarjous lähetetty onnistuneesti!' };
}

export async function acceptOfferAndFinalizePayment(offerId: string): Promise<ActionResult> {
  const supabase = await createClient(); // Removed cookieStore argument
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Get the offer and verify ownership
  const { data: offer, error: offerError } = await supabase
    .from('task_offers')
    .select(`
      id,
      task_id,
      tasker_id,
      status,
      task:tasks!inner(id, user_id, status)
    `)
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    return { success: false, message: 'Tarjousta ei löytynyt.' };
  }

  // Verify user owns the task and the task/offer are in the correct state
  if (offer.task.user_id !== user.id) {
    return { success: false, message: 'Et voi hyväksyä tarjousta tehtävään, joka ei ole sinun.' };
  }
  if (offer.task.status !== 'open') {
    return { success: false, message: 'Tehtävä ei ole enää avoin.' };
  }
  if (offer.status !== 'pending') {
    return { success: false, message: 'Tämä tarjous ei ole enää hyväksyttävissä.' };
  }

  // --- Start transaction-like operations after successful payment simulation ---

  // 1. Update task: set status to 'paid' and assign the tasker
  const { error: taskUpdateError } = await supabase
    .from('tasks')
    .update({ 
      status: 'paid', // Directly to paid as payment is "successful"
      assigned_tasker_id: offer.tasker_id
    })
    .eq('id', offer.task_id);

  if (taskUpdateError) {
    console.error('Error updating task status:', taskUpdateError);
    return { success: false, message: 'Tehtävän tilan päivitys epäonnistui.' };
  }

  // 2. Update the accepted offer's status
  const { error: offerUpdateError } = await supabase
    .from('task_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId);

  if (offerUpdateError) {
    console.error('Error updating accepted offer status:', offerUpdateError);
    // Attempt to roll back the task update for consistency
    await supabase.from('tasks').update({ status: 'open', assigned_tasker_id: null }).eq('id', offer.task_id);
    return { success: false, message: 'Hyväksytyn tarjouksen tilan päivitys epäonnistui.' };
  }

  // 3. Decline all other pending offers for this task
  const { error: declineOthersError } = await supabase
    .from('task_offers')
    .update({ status: 'declined' })
    .eq('task_id', offer.task_id)
    .neq('id', offerId)
    .eq('status', 'pending');

  if (declineOthersError) {
    console.warn('Could not decline other offers, but main flow succeeded:', declineOthersError);
  }
  
  revalidatePath(`/dashboard/tasks/${offer.task_id}`);
  revalidatePath('/dashboard/user');
  revalidatePath('/dashboard/tasker');

  return { success: true, message: 'Tehtävä maksettu ja varattu onnistuneesti!' };
}

export async function declineTaskOffer(offerId: string): Promise<ActionResult> {
  const supabase = await createClient(); // Removed cookieStore argument
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Get the offer and verify ownership
  const { data: offer, error: offerError } = await supabase
    .from('task_offers')
    .select(`
      id,
      task_id,
      status,
      task:tasks!inner(id, user_id)
    `)
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    return { success: false, message: 'Tarjousta ei löytynyt.' };
  }

  // Verify user owns the task
  if (offer.task.user_id !== user.id) {
    return { success: false, message: 'Et voi hylätä tarjousta tehtävään, joka ei ole sinun.' };
  }

  if (offer.status !== 'pending') {
    return { success: false, message: 'Tämä tarjous ei ole enää käytettävissä.' };
  }

  // Update offer status to declined
  const { error: updateError } = await supabase
    .from('task_offers')
    .update({ status: 'declined' })
    .eq('id', offerId);

  if (updateError) {
    console.error('Error declining offer:', updateError);
    return { success: false, message: 'Tarjouksen hylkääminen epäonnistui.' };
  }

  revalidatePath(`/dashboard/tasks/${offer.task_id}`);
  revalidatePath('/dashboard/user');

  return { success: true, message: 'Tarjous hylätty.' };
}

export async function markTaskCompleted(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Verify the task is assigned to this tasker and is in correct state
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, title, assigned_tasker_id, status, user_id, scheduled_date')
    .eq('id', taskId)
    .single();

  if (fetchError || !task) {
    console.error('Error fetching task or task not found:', fetchError);
    return { success: false, message: 'Tehtävää ei löytynyt tai sitä haettaessa tapahtui virhe.' };
  }

  if (task.assigned_tasker_id !== user.id) {
    return { success: false, message: 'Tämä tehtävä ei ole sinulle määritetty.' };
  }

  if (task.status !== 'paid' && task.status !== 'in_progress') {
    return { success: false, message: 'Tehtävää ei voida merkitä valmiiksi nykyisessä tilassa (' + task.status + ').' };
  }

  // Check if task is being completed before scheduled date
  const isEarlyCompletion = task.scheduled_date && 
    new Date() < new Date(task.scheduled_date) && 
    !isToday(new Date(task.scheduled_date));

  // Set appropriate status based on timing
  const newStatus = isEarlyCompletion ? 'early_completed' : 'completed';

  // Update the task status
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId);

  if (updateError) {
    console.error('Error marking task as completed:', updateError);
    return { success: false, message: `Tehtävän merkitseminen valmiiksi epäonnistui: ${updateError.message}` };
  }

  // Add appropriate system message based on completion type
  const messageContent = isEarlyCompletion 
    ? '⏰ Tehtävä on merkitty valmiiksi ennen aikataulutettua päivämäärää! Tasker on suorittanut työn aikaisin. Vahvista että tämä on hyväksyttävää.'
    : '🎉 Tehtävä on merkitty valmiiksi! Tasker on suorittanut työn. Voit nyt arvioida työn laadun.';

  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      task_id: taskId,
      sender_profile_id: user.id,
      receiver_profile_id: task.user_id,
      content: messageContent,
      is_read: false
    });

  if (messageError) {
    console.warn('Could not send completion notification message:', messageError);
  }

  // Create appropriate notification
  const notificationTitle = isEarlyCompletion ? 'Tehtävä valmistunut aikaisin' : 'Tehtävä valmistunut';
  const notificationMessage = isEarlyCompletion 
    ? 'Tehtävä on merkitty valmiiksi ennen aikataulutettua päivämäärää. Vahvista että tämä on hyväksyttävää.'
    : 'Tehtävä on merkitty valmiiksi. Voit nyt arvostella työn.';

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: task.user_id,
      title: notificationTitle,
      message: notificationMessage,
      type: isEarlyCompletion ? 'task_early_completed' : 'task_completed',
      related_task_id: taskId,
      is_read: false
    });

  if (notificationError) {
    console.warn('Could not create notification:', notificationError);
  }

  // If early completion, send user an email reminder about action needed
  if (isEarlyCompletion) {
    try {
      // Fetch recipient profile for email and first name
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', task.user_id)
        .single();

      if (!recipientError && recipientProfile?.email) {
        await sendEarlyCompletionRequestedEmail(
          {
            taskTitle: task.title ?? 'Tehtävä',
            taskId,
            userFirstName: recipientProfile.first_name || 'Asiakas',
            taskUrl: `/dashboard/tasks/${taskId}`,
            scheduledDate: task.scheduled_date || null,
            deadlineHours: 72,
          },
          recipientProfile.email
        );
      }
    } catch (emailError) {
      console.warn('Failed to send early completion requested email:', emailError);
    }
  }

  revalidatePath('/dashboard/tasker');
  revalidatePath('/dashboard/user');
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath(`/messages?taskId=${taskId}`);

  const resultMessage = isEarlyCompletion 
    ? 'Tehtävä merkitty valmiiksi aikaisin! Asiakas saa ilmoituksen ja voi vahvistaa aikaisen valmistumisen.'
    : 'Tehtävä merkitty valmiiksi! Asiakas saa ilmoituksen ja voi nyt arvioida työn.';

  return { success: true, message: resultMessage };
}

// Add helper function for date checking
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// New action for user to confirm early completion
export async function confirmEarlyCompletion(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Verify the task belongs to this user and is in early_completed state
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, status, assigned_tasker_id')
    .eq('id', taskId)
    .single();

  if (fetchError || !task) {
    console.error('Error fetching task or task not found:', fetchError);
    return { success: false, message: 'Tehtävää ei löytynyt tai sitä haettaessa tapahtui virhe.' };
  }

  if (task.user_id !== user.id) {
    return { success: false, message: 'Tämä tehtävä ei ole sinun.' };
  }

  if (task.status !== 'early_completed') {
    return { success: false, message: 'Tehtävä ei ole aikaisen valmistumisen tilassa.' };
  }

  // Update task status to completed
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId);

  if (updateError) {
    console.error('Error confirming early completion:', updateError);
    return { success: false, message: `Aikaisen valmistumisen vahvistaminen epäonnistui: ${updateError.message}` };
  }

  // Add system message about confirmation
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      task_id: taskId,
      sender_profile_id: user.id,
      receiver_profile_id: task.assigned_tasker_id!,
      content: '✅ Asiakas on vahvistanut aikaisen valmistumisen! Tehtävä on nyt virallisesti valmis.',
      is_read: false
    });

  if (messageError) {
    console.warn('Could not send confirmation message:', messageError);
  }

  // Create notification for the tasker
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: task.assigned_tasker_id!,
      title: 'Aikainen valmistuminen vahvistettu',
      message: 'Asiakas on vahvistanut tehtävän aikaisen valmistumisen.',
      type: 'early_completion_confirmed',
      related_task_id: taskId,
      is_read: false
    });

  if (notificationError) {
    console.warn('Could not create notification:', notificationError);
  }

  revalidatePath('/dashboard/user');
  revalidatePath('/dashboard/tasker');
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath(`/messages?taskId=${taskId}`);

  return { success: true, message: 'Aikainen valmistuminen vahvistettu! Tehtävä on nyt virallisesti valmis.' };
}

// New action for user to reject early completion
export async function rejectEarlyCompletion(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Käyttäjää ei ole tunnistettu.' };
  }

  // Verify the task belongs to this user and is in early_completed state
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, status, assigned_tasker_id')
    .eq('id', taskId)
    .single();

  if (fetchError || !task) {
    console.error('Error fetching task or task not found:', fetchError);
    return { success: false, message: 'Tehtävää ei löytynyt tai sitä haettaessa tapahtui virhe.' };
  }

  if (task.user_id !== user.id) {
    return { success: false, message: 'Tämä tehtävä ei ole sinun.' };
  }

  if (task.status !== 'early_completed') {
    return { success: false, message: 'Tehtävä ei ole aikaisen valmistumisen tilassa.' };
  }

  // Update task status back to in_progress
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('id', taskId);

  if (updateError) {
    console.error('Error rejecting early completion:', updateError);
    return { success: false, message: `Aikaisen valmistumisen hylkääminen epäonnistui: ${updateError.message}` };
  }

  // Add system message about rejection
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      task_id: taskId,
      sender_profile_id: user.id,
      receiver_profile_id: task.assigned_tasker_id!,
      content: '❌ Asiakas on hylännyt aikaisen valmistumisen. Tehtävä on palautettu työn alla -tilaan. Jatka työtä aikataulun mukaisesti.',
      is_read: false
    });

  if (messageError) {
    console.warn('Could not send rejection message:', messageError);
  }

  // Create notification for the tasker
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: task.assigned_tasker_id!,
      title: 'Aikainen valmistuminen hylätty',
      message: 'Asiakas on hylännyt tehtävän aikaisen valmistumisen. Jatka työtä aikataulun mukaisesti.',
      type: 'early_completion_rejected',
      related_task_id: taskId,
      is_read: false
    });

  if (notificationError) {
    console.warn('Could not create notification:', notificationError);
  }

  revalidatePath('/dashboard/user');
  revalidatePath('/dashboard/tasker');
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath(`/messages?taskId=${taskId}`);

  return { success: true, message: 'Aikainen valmistuminen hylätty. Tehtävä on palautettu työn alla -tilaan.' };
}
interface CreatePaymentActionResult {
  success: boolean;
  paymentUrl?: string;
  message: string;
}

export async function createPayment(
  offerId: string,
  taskId: string,
  amount: number,
  email: string
): Promise<CreatePaymentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'User not authenticated.' };
  }

  // 1. Fetch the offer and verify it's valid to accept
  const { data: offer, error: offerError } = await supabase
    .from('task_offers')
    .select('id, task_id, tasker_id, status, task:tasks!inner(id, user_id, status)')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    return { success: false, message: 'Tarjousta ei löytynyt.' };
  }
  if (offer.task.user_id !== user.id) {
    return { success: false, message: 'Et voi hyväksyä tarjousta tehtävään, joka ei ole sinun.' };
  }
  if (offer.task.status !== 'open') {
    return { success: false, message: 'Tehtävä ei ole enää avoin.' };
  }
  if (offer.status !== 'pending') {
    return { success: false, message: 'Tämä tarjous ei ole enää hyväksyttävissä.' };
  }

  // 2. Update the accepted offer's status
  const { error: offerUpdateError } = await supabase
    .from('task_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId);

  if (offerUpdateError) {
    console.error('Error updating accepted offer status:', offerUpdateError);
    return { success: false, message: 'Hyväksytyn tarjouksen tilan päivitys epäonnistui.' };
  }

  // 3. Decline all other pending offers for this task
  const { error: declineOthersError } = await supabase
    .from('task_offers')
    .update({ status: 'declined' })
    .eq('task_id', offer.task_id)
    .neq('id', offerId)
    .eq('status', 'pending');

  if (declineOthersError) {
    console.warn('Could not decline other offers, but main flow succeeded:', declineOthersError);
  }

  // 4. Create a 'pending' payment record in the database
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      amount: amount,
      currency: 'EUR',
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !payment) {
    console.error('Error creating pending payment record:', insertError);
    // Attempt to roll back the offer status for consistency
    await supabase.from('task_offers').update({ status: 'pending' }).eq('id', offerId);
    return {
      success: false,
      message: 'Failed to initialize payment record.',
    };
  }

  const orderId = payment.id;

  // If Paytrail mock mode is enabled, simulate a successful payment immediately
  const isMockMode =
    process.env.PAYTRAIL_MOCK === 'true' ||
    process.env.NEXT_PUBLIC_PAYTRAIL_MOCK === 'true';

  if (isMockMode) {
    // 5a. Mark payment as paid
    await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('id', orderId);

    // 5b. Update task to paid and assign the tasker from the accepted offer
    await supabase
      .from('tasks')
      .update({
        status: 'paid',
        assigned_tasker_id: offer.tasker_id,
      })
      .eq('id', taskId);

    // 5c. Return a mock payment URL that immediately returns to the task page
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      success: true,
      paymentUrl: `${appUrl}/dashboard/tasks/${taskId}?payment=success&orderId=${orderId}&mock=1`,
      message: 'Mock payment processed successfully.',
    };
  }

  // 5. Initiate payment with Paytrail using the new payment ID as the stamp
  try {
    const paymentResponse = await initiatePayment({
      amountCents: Math.round(amount * 100),
      currency: 'EUR',
      orderId: orderId, // This is the payment.id, used as checkout-stamp
      customerEmail: email,
      taskId: taskId, // This is the task.id, used as checkout-reference
    });

    if (paymentResponse.paymentUrl) {
      revalidatePath(`/dashboard/tasks/${taskId}`);
      return {
        success: true,
        paymentUrl: paymentResponse.paymentUrl,
        message: 'Payment initiated successfully.',
      };
    } else {
      // Rollback offer status
      await supabase.from('task_offers').update({ status: 'pending' }).eq('id', offerId);
      return {
        success: false,
        message: 'Failed to get payment URL from Paytrail.',
      };
    }
  } catch (error) {
    console.error('Error initiating Paytrail payment:', error);
    // Rollback offer status
    await supabase.from('task_offers').update({ status: 'pending' }).eq('id', offerId);
    return {
      success: false,
      message: 'An error occurred while contacting the payment provider.',
    };
  }
}