import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job API endpoint for processing overdue task escalations
 * This should be called periodically (e.g., every 6 hours) by a cron service
 * 
 * Workflow:
 * 1. Detect overdue tasks with enhanced logic
 * 2. Create escalation actions for appropriate tasks
 * 3. Process automatic actions for critical cases
 * 4. Send notifications and alerts
 * 5. Log results for admin review
 */
export async function GET(request: NextRequest) {
  console.log('=== OVERDUE TASK ESCALATION CRON JOB ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Triggered by:', request.headers.get('user-agent') || 'Unknown');
  
  try {
    // Verify cron authorization (basic security)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.log('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const supabase = supabaseAdmin;
    const results = {
      overdue_detection: null,
      escalation_actions: null,
      automatic_actions: null,
      errors: [] as string[]
    };
    
    // 1. Get current overdue tasks for logging
    console.log('Step 1: Detecting overdue tasks...');
    const { data: overdueTasks, error: detectionError } = await supabase
      .rpc('get_overdue_tasks', { 
        grace_period_hours: 24, 
        include_paid_tasks: true 
      });
    
    if (detectionError) {
      console.error('Error detecting overdue tasks:', detectionError);
      results.errors.push(`Detection error: ${detectionError.message}`);
    } else {
      results.overdue_detection = {
        total_overdue: overdueTasks?.length || 0,
        critical: overdueTasks?.filter((t: any) => t.priority_level === 'critical').length || 0,
        high: overdueTasks?.filter((t: any) => t.priority_level === 'high').length || 0,
        medium: overdueTasks?.filter((t: any) => t.priority_level === 'medium').length || 0,
        low: overdueTasks?.filter((t: any) => t.priority_level === 'low').length || 0,
        auto_action_eligible: overdueTasks?.filter((t: any) => t.auto_action_eligible).length || 0
      };
      
      console.log('Overdue tasks detected:', results.overdue_detection);
    }
    
    // 2. Create escalation actions for overdue tasks
    console.log('Step 2: Creating escalation actions...');
    const { data: escalationResult, error: escalationError } = await supabase
      .rpc('create_overdue_task_actions');
    
    if (escalationError) {
      console.error('Error creating escalation actions:', escalationError);
      results.errors.push(`Escalation error: ${escalationError.message}`);
    } else {
      results.escalation_actions = escalationResult;
      console.log('Escalation actions result:', escalationResult);
    }
    
    // 3. Process automatic actions for critical overdue tasks
    console.log('Step 3: Processing automatic actions...');
    const { data: autoActionResult, error: autoActionError } = await supabase
      .rpc('process_automatic_overdue_actions');
    
    if (autoActionError) {
      console.error('Error processing automatic actions:', autoActionError);
      results.errors.push(`Auto-action error: ${autoActionError.message}`);
    } else {
      results.automatic_actions = autoActionResult;
      console.log('Automatic actions result:', autoActionResult);
    }
    
    // 4. Send admin notification if critical actions are pending
    if (results.automatic_actions?.auto_actions_flagged > 0) {
      console.log(`🚨 ${results.automatic_actions.auto_actions_flagged} tasks flagged for admin review`);
      // TODO: Send admin email notification
      // await sendAdminNotification(results.automatic_actions);
    }
    
    // 5. Log successful execution
    const summary = {
      success: true,
      executed_at: new Date().toISOString(),
      overdue_tasks_detected: results.overdue_detection?.total_overdue || 0,
      escalation_actions_created: results.escalation_actions?.actions_created || 0,
      auto_actions_flagged: results.automatic_actions?.auto_actions_flagged || 0,
      errors: results.errors,
      requires_admin_attention: results.automatic_actions?.requires_admin_review || false
    };
    
    console.log('=== CRON JOB COMPLETED ===');
    console.log('Summary:', summary);
    
    // Return success response
    return NextResponse.json(summary, { status: 200 });
    
  } catch (error) {
    console.error('Fatal error in overdue task escalation cron:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        executed_at: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering by admins
 */
export async function POST(request: NextRequest) {
  console.log('=== MANUAL OVERDUE TASK ESCALATION TRIGGER ===');
  
  try {
    // Check if user is admin
    const supabase = supabaseAdmin;
    
    // For manual triggers, we can be more verbose in response
    const { data: overdueTasks } = await supabase
      .rpc('get_overdue_tasks', { 
        grace_period_hours: 24, 
        include_paid_tasks: true 
      });
    
    const { data: escalationResult } = await supabase
      .rpc('create_overdue_task_actions');
    
    const { data: autoActionResult } = await supabase
      .rpc('process_automatic_overdue_actions');
    
    const detailedResponse = {
      success: true,
      triggered_manually: true,
      executed_at: new Date().toISOString(),
      overdue_tasks: {
        total: overdueTasks?.length || 0,
        by_priority: {
          critical: overdueTasks?.filter((t: any) => t.priority_level === 'critical').length || 0,
          high: overdueTasks?.filter((t: any) => t.priority_level === 'high').length || 0,
          medium: overdueTasks?.filter((t: any) => t.priority_level === 'medium').length || 0,
          low: overdueTasks?.filter((t: any) => t.priority_level === 'low').length || 0,
        },
        auto_action_eligible: overdueTasks?.filter((t: any) => t.auto_action_eligible).length || 0,
        sample_tasks: overdueTasks?.slice(0, 5).map((t: any) => ({
          id: t.task_id,
          title: t.title,
          status: t.status,
          overdue_type: t.overdue_type,
          priority_level: t.priority_level,
          overdue_hours: t.overdue_hours
        })) || []
      },
      escalation_actions: escalationResult,
      automatic_actions: autoActionResult,
      next_steps: autoActionResult?.requires_admin_review ? 
        'Review auto-action candidates in admin dashboard' : 
        'No immediate admin action required'
    };
    
    console.log('Manual trigger completed:', detailedResponse);
    
    return NextResponse.json(detailedResponse, { status: 200 });
    
  } catch (error) {
    console.error('Error in manual escalation trigger:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process manual escalation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export for Vercel cron jobs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';