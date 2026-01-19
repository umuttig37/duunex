import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // --- SECURITY CHECK ---
  // This endpoint should only be available in the development environment.
  if (process.env.NODE_ENV !== 'development') {
    console.warn(
      'Attempted to access simulation endpoint in non-development environment.'
    );
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required.' },
        { status: 400 }
      );
    }

    console.log(`--- SIMULATING PAYTRAIL SUCCESS FOR TASK: ${taskId} ---`);

    const supabase = await createClient();

    // Find the most recent 'pending' payment for the given task
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('task_id', taskId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (paymentError || !payment) {
      console.error(
        `Simulation Error: No pending payment found for task ${taskId}.`,
        paymentError
      );
      return NextResponse.json(
        { error: `No pending payment found for task ${taskId}.` },
        { status: 404 }
      );
    }

    console.log(`Found pending payment ID: ${payment.id}. Updating status with 3% fee processing...`);

    // 1. Update payment status to 'paid' using the enhanced 3% fee system
    const simulatedTransactionId = `simulated_${new Date().getTime()}`;
    
    const { data: updateResult, error: updatePaymentError } = await supabase
      .rpc('update_payment_from_paytrail_callback', {
        payment_id: payment.id,
        new_status: 'paid',
        paytrail_transaction_id: simulatedTransactionId,
        raw_response: `simulation=true&taskId=${taskId}`
      });

    if (updatePaymentError) {
      console.error(
        `Simulation Error: Failed to update payment ${payment.id} with 3% fee processing.`,
        updatePaymentError
      );
      return NextResponse.json(
        { error: 'Failed to update payment status with fee processing.' },
        { status: 500 }
      );
    }

    if (!updateResult || !updateResult.success) {
      console.error(
        `Simulation Error: Payment update failed for ${payment.id}.`,
        updateResult?.error || 'Unknown error'
      );
      return NextResponse.json(
        { error: updateResult?.error || 'Payment update failed.' },
        { status: 500 }
      );
    }

    console.log(`Payment ${payment.id} updated successfully with 3% fee processing:`, updateResult);

    // The RPC function update_payment_from_paytrail_callback already handles:
    // - Task status update to 'paid'
    // - Tasker assignment
    // - Balance updates with 97% payout
    // - Admin revenue tracking with 3% fees
    // - Initial chat message creation
    // So no additional task updates are needed here

    console.log(`--- SIMULATION SUCCESS: Task ${taskId} payment processed with full 3% fee integration ---`);
    console.log(`Processing details:`, {
      payment_id: updateResult.payment_id,
      task_id: updateResult.task_id,
      fee_processing: updateResult.fee_processing,
      balance_update: updateResult.balance_update,
      task_status_updated: updateResult.task_status_updated
    });

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} successfully marked as paid and assigned.`,
    });
  } catch (error) {
    console.error('Error in simulation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}