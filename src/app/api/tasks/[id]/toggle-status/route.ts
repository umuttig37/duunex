import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const taskId = params.id;

    if (!status || !['open', 'disabled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "open" or "disabled"' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns the task and it's eligible for status change
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('user_id, status, created_at, offers_count:task_offers(count)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this task' },
        { status: 403 }
      );
    }

    // Check if task is eligible for status toggle
    if (!['open', 'disabled'].includes(task.status)) {
      return NextResponse.json(
        { error: 'Task status cannot be changed' },
        { status: 400 }
      );
    }

    // Check if task is old enough (2+ days) and has no offers
    const taskCreated = new Date(task.created_at);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const offersCount = Array.isArray(task.offers_count) ? task.offers_count.length : 0;
    
    if (taskCreated > twoDaysAgo || offersCount > 0) {
      return NextResponse.json(
        { error: 'Task is not eligible for status change (must be 2+ days old with no offers)' },
        { status: 400 }
      );
    }

    // Update task status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Task ${status === 'disabled' ? 'hidden' : 'made visible'}` 
    });

  } catch (error) {
    console.error('Error in toggle-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}