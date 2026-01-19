import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query parameters schema
const feedbackQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => Math.min(parseInt(val, 10), 100)).default('20'),
  status: z.enum(['all', 'new', 'reviewed', 'archived']).default('all'),
  sortBy: z.enum(['created_at', 'concept_clarity_score', 'usability_score', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// Check if user is admin
async function checkAdminAccess(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No authenticated user found');
    return false;
  }

  console.log('Checking admin access for user:', user.id);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return false;
  }

  console.log('User profile role:', profile?.role);
  return profile?.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin access
    if (!await checkAdminAccess(supabase)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = feedbackQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      search: searchParams.get('search'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    // Build the query
    // @ts-ignore - user_feedback table not in generated types yet
    let feedbackQuery = (supabase as any)
      .from('user_feedback')
      .select(`
        id,
        user_id,
        session_id,
        concept_clarity_score,
        usability_score,
        open_feedback,
        page_url,
        created_at,
        status,
        admin_notes,
        reviewed_at,
        is_authenticated,
        feedback_version,
        user:profiles!user_feedback_user_id_fkey(first_name, last_name, email),
        reviewed_by_profile:profiles!user_feedback_reviewed_by_fkey(first_name, last_name)
      `, { count: 'exact' });

    // Apply filters
    if (query.status !== 'all') {
      feedbackQuery = feedbackQuery.eq('status', query.status);
    }

    if (query.startDate) {
      feedbackQuery = feedbackQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      feedbackQuery = feedbackQuery.lte('created_at', query.endDate);
    }

    if (query.search) {
      // Search in open feedback and admin notes
      feedbackQuery = feedbackQuery.or(
        `open_feedback.ilike.%${query.search}%,admin_notes.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    feedbackQuery = feedbackQuery.order(query.sortBy, { ascending: query.sortOrder === 'asc' });

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    feedbackQuery = feedbackQuery.range(offset, offset + query.limit - 1);

    const { data: feedback, error, count } = await feedbackQuery;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Get statistics
    // @ts-ignore - function not in generated types yet
    const { data: stats, error: statsError } = await (supabase as any).rpc('get_feedback_stats');
    
    if (statsError) {
      console.error('Error fetching feedback stats:', statsError);
    }

    console.log('Fetched feedback data:', {
      feedbackCount: feedback?.length || 0,
      total: count,
      stats: stats?.[0]
    });

    return NextResponse.json({
      feedback,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
      stats: (stats as any)?.[0] || {},
      filters: {
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
      },
    });

  } catch (error) {
    console.error('Admin feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update feedback status and notes
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin access
    if (!await checkAdminAccess(supabase)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { feedbackId, status, adminNotes } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['new', 'reviewed', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current user for reviewed_by field
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'reviewed') {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }
    }
    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    // Update feedback
    // @ts-ignore - user_feedback table not in generated types yet
    const { data, error } = await (supabase as any)
      .from('user_feedback')
      .update(updateData)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feedback updated successfully',
      feedback: data,
    });

  } catch (error) {
    console.error('Admin feedback update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}