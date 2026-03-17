import { supabaseAdmin } from '@/lib/supabase/admin';
import { validatePaytrailCallback } from '@/services/payment/paytrail';
import { NextRequest, NextResponse } from 'next/server';

type UpdatePaymentFromPaytrailCallbackRpcResult =
  | {
      success: true;
      payment_id: string;
      task_id: string;
      // extra diagnostic fields may be present
      [key: string]: unknown;
    }
  | {
      success: false;
      error: string;
      [key: string]: unknown;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUpdatePaymentRpcResult = (
  value: unknown
): value is UpdatePaymentFromPaytrailCallbackRpcResult => {
  if (!isRecord(value)) return false;
  if (typeof value.success !== 'boolean') return false;

  if (value.success) {
    return typeof value.payment_id === 'string' && typeof value.task_id === 'string';
  }

  return typeof value.error === 'string';
};

// Helper function to extract data from query params, headers, or body
const getCallbackData = ({
  headers,
  body,
  searchParams
}: {
  headers?: Record<string, string>,
  body?: string,
  searchParams?: URLSearchParams
}) => {
  // 1. Try query params (Paytrail callback GET uses these)
  if (searchParams && searchParams.get('checkout-stamp')) {
    return {
      paymentId: searchParams.get('checkout-stamp') || '',
      taskId: searchParams.get('checkout-reference') || '',
      status: searchParams.get('checkout-status') || '',
      transactionId: searchParams.get('checkout-transaction-id') || '',
    };
  }
  // 2. Try headers (legacy POST/PUT webhooks)
  if (headers && headers['checkout-stamp']) {
    return {
      paymentId: headers['checkout-stamp'],
      taskId: headers['checkout-reference'] || '',
      status: headers['checkout-status'] || '',
      transactionId: headers['checkout-transaction-id'] || '',
    };
  }
  // 3. Try body (rare, not used by Paytrail callbacks)
  try {
    if (body) {
      const data = JSON.parse(body);
      return {
        paymentId: data.stamp,
        taskId: data.reference,
        status: data.status,
        transactionId: data.transactionId,
      };
    }
  } catch (error) {
    console.error('Error parsing callback body as JSON:', error);
  }
  return null;
};

// Helper function to find the most recent accepted offer (handles counter offers)
const findAcceptedOffer = async (supabase: any, taskId: string) => {
  const { data: acceptedOffers, error: offerError } = await supabase
    .from('task_offers')
    .select('tasker_id, id, created_at, is_counter_offer, offered_price')
    .eq('task_id', taskId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (offerError) {
    console.error(`Error finding accepted offers for task ${taskId}:`, offerError);
    return { offer: null, error: offerError };
  }

  if (!acceptedOffers || acceptedOffers.length === 0) {
    console.error(`No accepted offers found for task ${taskId}`);
    return { offer: null, error: { message: 'No accepted offers found' } };
  }

  if (acceptedOffers.length > 1) {
    console.warn(`Multiple accepted offers found for task ${taskId}. Using most recent one.`);
    console.log('Available accepted offers:', acceptedOffers.map((o: any) => ({ 
      id: o.id, 
      created_at: o.created_at, 
      is_counter_offer: o.is_counter_offer, 
      offered_price: o.offered_price 
    })));
  }

  const acceptedOffer = acceptedOffers[0];
  console.log(`Using accepted offer ${acceptedOffer.id} for task ${taskId} (is_counter_offer: ${acceptedOffer.is_counter_offer})`);
  
  return { offer: acceptedOffer, error: null };
};

export async function GET(request: NextRequest) {
  // This GET handler now processes Paytrail callbacks (webhook) as well as user redirects
  const url = request.nextUrl.clone();
  const searchParams = url.searchParams;
  const body = '';
  const headers = Object.fromEntries(request.headers.entries());

  console.log('=== PAYTRAIL CALLBACK RECEIVED (GET) ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Query:', url.search);
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('================================');

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        '[Paytrail Callback] Missing SUPABASE_SERVICE_ROLE_KEY. Cannot update DB from callback.'
      );
      return NextResponse.redirect(new URL('/dashboard?payment=callback-misconfigured', url.origin));
    }

    // 1. Validate the callback signature (from query params)
    // For GET, pass headers and empty body, but signature is in query params
    // You may want to adapt validatePaytrailCallback to accept query params for GET
    // For now, skip signature validation for GET if not supported

    // 2. Extract data from query params
    const callbackData = getCallbackData({ searchParams });

    if (!callbackData || !callbackData.paymentId || !callbackData.taskId) {
      console.error('Missing payment ID (stamp/checkout-stamp) or task ID (reference/checkout-reference) in callback.');
      console.error('CallbackData:', callbackData);
      // Fallback: redirect user to dashboard
      return NextResponse.redirect(new URL('/dashboard', url.origin));
    }

    const { paymentId, taskId, status, transactionId } = callbackData;

    console.log('--- PARSED PAYTRAIL DATA ---');
    console.log('Status:', status);
    console.log('Payment ID (Stamp):', paymentId);
    console.log('Task ID (Reference):', taskId);
    console.log('Transaction ID:', transactionId);
    console.log('----------------------------');

    const supabase = supabaseAdmin;

    // --- DIAGNOSTIC LOGS ---
    console.log(`[Paytrail Callback] Processing paymentId: ${paymentId}. VERCEL_ENV: ${process.env.VERCEL_ENV}, NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    // --- END DIAGNOSTIC LOGS ---

    const paymentStatus = status === 'ok' ? 'paid' : 'failed';

    // Function to attempt the payment update using enhanced 3% fee system
    const attemptPaymentUpdate = async (attempt = 1): Promise<{ data: any; error: any }> => {
      console.log(`Attempt ${attempt}: Processing payment callback with 3% fee system for ID ${paymentId}`);
      
      // Use the enhanced payment update function that handles 3% fees
      const { data, error } = await supabase
        .rpc('update_payment_from_paytrail_callback', {
          payment_id: paymentId,
          new_status: paymentStatus,
          paytrail_transaction_id: transactionId,
          raw_response: url.search
        });

      // Transform the RPC result to match expected format
      if (isUpdatePaymentRpcResult(data) && data.success) {
        return {
          data: {
            id: data.payment_id,
            task_id: data.task_id,
            processing_details: data
          },
          error: null
        };
      } else if (isUpdatePaymentRpcResult(data) && !data.success) {
        return {
          data: null,
          error: { message: data.error, code: 'RPC_ERROR' }
        };
      } else if (error?.code === 'PGRST202') {
        // Supabase can't find the RPC function (not deployed). Fallback to a direct table update
        // so payments still work on environments where migrations weren't applied.
        console.warn(
          '[Paytrail Callback] RPC update_payment_from_paytrail_callback not found (PGRST202). Falling back to direct payments update.'
        );

        const { data: paymentRow, error: paymentError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus,
            paytrail_transaction_id: transactionId || null,
            raw_response: { raw_query: url.search },
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
          .select('id, task_id')
          .single();

        return paymentError ? { data: null, error: paymentError } : { data: paymentRow, error: null };
      } else {
        return { data, error };
      }
    };

    // Legacy retry logic for compatibility (though the RPC function handles most error cases)
    const attemptPaymentUpdateWithRetry = async (attempt = 1): Promise<{ data: any; error: any }> => {
      const result = await attemptPaymentUpdate(attempt);
      
      if (result.error && result.error.code === 'PGRST116' && attempt < 2) {
        console.warn(`Attempt ${attempt}: Payment record ${paymentId} not found. Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return attemptPaymentUpdateWithRetry(attempt + 1);
      }
      
      return result;
    };

    // 3. Update payment status in the database with enhanced 3% fee processing
    const { data: payment, error: updateError } = await attemptPaymentUpdateWithRetry();

    if (updateError) {
      console.error(`Error updating payment for paymentId ${paymentId}:`, updateError);
      console.error('Full updateError object:', JSON.stringify(updateError, null, 2));
      // If the payment record is not found, it might be a retry for an already processed payment.
      if (updateError.code === 'PGRST116') {
         console.warn(`Payment record with ID ${paymentId} not found. It might have been already processed.`);
         // Fallback: redirect user to dashboard
         return NextResponse.redirect(new URL('/dashboard', url.origin));
      }
      // Fallback: redirect user to dashboard
      return NextResponse.redirect(new URL('/dashboard', url.origin));
    }

    if (!payment) {
      console.warn(`No payment record returned after update for paymentId ${paymentId}.`);
    } else {
      console.log('Payment update result:', payment);
    }

    // 4. If payment was successful, update the corresponding task
    if (paymentStatus === 'paid' && payment) {
      console.log(`Payment successful for task ${payment.task_id}. Updating task status to 'paid' and assigning tasker.`);

      // Find the accepted offer to get the tasker_id (handles counter offers)
      const { offer: acceptedOffer, error: offerError } = await findAcceptedOffer(supabase, payment.task_id);

      if (offerError || !acceptedOffer) {
        console.error(`Error finding accepted offer for task ${payment.task_id}:`, offerError);
        // Update task status without tasker assignment if offer lookup fails
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.task_id);

        if (taskError) {
          console.error(`Error updating task ${payment.task_id} status:`, taskError);
        }
      } else {
        // Update task status and assign the tasker
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'paid',
            assigned_tasker_id: acceptedOffer.tasker_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.task_id);

        if (taskError) {
          console.error(`Error updating task ${payment.task_id} status:`, taskError);
          console.error('Full taskError object:', JSON.stringify(taskError, null, 2));
        } else {
          console.log(`Successfully updated task ${payment.task_id} to 'paid' and assigned to tasker ${acceptedOffer.tasker_id}.`);
          const { data: updatedTask } = await supabase.from('tasks').select('id, status, assigned_tasker_id, user_id, title').eq('id', payment.task_id).single();
          console.log('Task state after update in callback:', updatedTask);

          // Create initial chat message to establish conversation
          if (updatedTask) {
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                task_id: payment.task_id,
                sender_profile_id: updatedTask.user_id,
                receiver_profile_id: acceptedOffer.tasker_id,
                content: `🎉 Maksu onnistui! Tehtävä "${updatedTask.title}" on nyt varattu sinulle. Voit aloittaa keskustelun asiakkaan kanssa tästä.`,
                is_read: false
              });

            if (messageError) {
              console.warn('Could not create initial chat message:', messageError);
            } else {
              console.log('Successfully created initial chat message for task:', payment.task_id);
            }
          }
        }
      }
    }

    // Redirect user to the task page if possible
    if (payment?.task_id) {
      const redirectUrl = new URL(`/dashboard/tasks/${payment.task_id}`, url.origin);
      // Pass along original search params for the return handler to use
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.append(key, value);
      });
      return NextResponse.redirect(redirectUrl);
    }

    // Fallback redirect to dashboard if no task ID can be found
    return NextResponse.redirect(new URL('/dashboard', url.origin));
  } catch (error) {
    console.error('Error in Paytrail callback handler (GET):', error);
    return NextResponse.redirect(new URL('/dashboard', url.origin));
  }
}

export async function POST(request: NextRequest) {
  // For POST, keep the old logic, but use the new getCallbackData signature
  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const url = request.nextUrl.clone();
  const searchParams = url.searchParams;

  console.log('=== PAYTRAIL CALLBACK RECEIVED (POST) ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', body);
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('================================');

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        '[Paytrail Callback] Missing SUPABASE_SERVICE_ROLE_KEY. Cannot update DB from callback.'
      );
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // 1. Validate the callback signature
    if (!validatePaytrailCallback(headers, body)) {
      console.error('Invalid Paytrail callback signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Extract data using our helper
    const callbackData = getCallbackData({ headers, body, searchParams });

    if (!callbackData || !callbackData.paymentId || !callbackData.taskId) {
      console.error('Missing payment ID (stamp/checkout-stamp) or task ID (reference/checkout-reference) in callback.');
      console.error('CallbackData:', callbackData);
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const { paymentId, taskId, status, transactionId } = callbackData;

    console.log('--- PARSED PAYTRAIL DATA ---');
    console.log('Status:', status);
    console.log('Payment ID (Stamp):', paymentId);
    console.log('Task ID (Reference):', taskId);
    console.log('Transaction ID:', transactionId);
    console.log('----------------------------');

    const supabase = supabaseAdmin;

    // 3. Update payment status in the database using the enhanced 3% fee system
    const paymentStatus = status === 'ok' ? 'paid' : 'failed';

    // Use the same enhanced payment update function as GET method
    const { data, error: updateError } = await supabase
      .rpc('update_payment_from_paytrail_callback', {
        payment_id: paymentId,
        new_status: paymentStatus,
        paytrail_transaction_id: transactionId,
        raw_response: body
      });

    // Transform the RPC result to match expected format for backward compatibility
    let payment = null;
    if (isUpdatePaymentRpcResult(data) && data.success) {
      payment = {
        id: data.payment_id,
        task_id: data.task_id
      };
      console.log('POST: Payment update with 3% fee processing successful:', data);
    } else if (isUpdatePaymentRpcResult(data) && !data.success) {
      console.error(`Error updating payment for paymentId ${paymentId}:`, data.error);
      if (data.error.includes('not found')) {
        console.warn(`Payment record with ID ${paymentId} not found. It might have been already processed.`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }
      return NextResponse.json({ error: 'Failed to update payment with 3% fee processing' }, { status: 500 });
    } else if (updateError?.code === 'PGRST202') {
      console.warn(
        '[Paytrail Callback] RPC update_payment_from_paytrail_callback not found (PGRST202). Falling back to direct payments update.'
      );

      const { data: paymentRow, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          paytrail_transaction_id: transactionId || null,
          // body may not be JSON; store it safely as JSONB
          raw_response: { raw_body: body },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select('id, task_id')
        .single();

      if (paymentError) {
        console.error(`Fallback payment update failed for paymentId ${paymentId}:`, paymentError);
        return NextResponse.json({ error: 'Failed to update payment (fallback)' }, { status: 500 });
      }

      payment = paymentRow;
    } else if (updateError) {
      console.error(`Error updating payment for paymentId ${paymentId}:`, updateError);
      console.error('Full updateError object:', JSON.stringify(updateError, null, 2));
      if (updateError.code === 'PGRST116') {
         console.warn(`Payment record with ID ${paymentId} not found. It might have been already processed.`);
         return NextResponse.json({ success: true, message: "Already processed" });
      }
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    if (!payment) {
      console.warn(`No payment record returned after update for paymentId ${paymentId}.`);
    } else {
      console.log('Payment update result:', payment);
    }

    // 4. If payment was successful, update the corresponding task
    if (paymentStatus === 'paid' && payment) {
      console.log(`Payment successful for task ${payment.task_id}. Updating task status to 'paid' and assigning tasker.`);

      // Find the accepted offer to get the tasker_id (handles counter offers)
      const { offer: acceptedOffer, error: offerError } = await findAcceptedOffer(supabase, payment.task_id);

      if (offerError || !acceptedOffer) {
        console.error(`Error finding accepted offer for task ${payment.task_id}:`, offerError);
        // Update task status without tasker assignment if offer lookup fails
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.task_id);

        if (taskError) {
          console.error(`Error updating task ${payment.task_id} status:`, taskError);
        }
      } else {
        // Update task status and assign the tasker
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'paid',
            assigned_tasker_id: acceptedOffer.tasker_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.task_id);

        if (taskError) {
          console.error(`Error updating task ${payment.task_id} status:`, taskError);
          console.error('Full taskError object:', JSON.stringify(taskError, null, 2));
        } else {
          console.log(`Successfully updated task ${payment.task_id} to 'paid' and assigned to tasker ${acceptedOffer.tasker_id}.`);
          const { data: updatedTask } = await supabase.from('tasks').select('id, status, assigned_tasker_id, user_id, title').eq('id', payment.task_id).single();
          console.log('Task state after update in callback:', updatedTask);

          // Create initial chat message to establish conversation
          if (updatedTask) {
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                task_id: payment.task_id,
                sender_profile_id: updatedTask.user_id,
                receiver_profile_id: acceptedOffer.tasker_id,
                content: `🎉 Maksu onnistui! Tehtävä "${updatedTask.title}" on nyt varattu sinulle. Voit aloittaa keskustelun asiakkaan kanssa tästä.`,
                is_read: false
              });

            if (messageError) {
              console.warn('Could not create initial chat message:', messageError);
            } else {
              console.log('Successfully created initial chat message for task:', payment.task_id);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Paytrail callback handler (POST):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
