import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for feedback submission
const feedbackSchema = z.object({
  conceptClarityScore: z.number().int().min(0).max(10),
  usabilityScore: z.number().int().min(0).max(10),
  openFeedback: z.string().max(2000).optional(),
  pageUrl: z.string().url().optional(),
  sessionId: z.string().uuid().optional(),
  userAgent: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  viewportSize: z.string().max(50).optional(),
});

// Rate limiting tracking (in-memory for now, could be moved to Redis)
const submissionTracker = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_SUBMISSIONS_PER_HOUR = 3;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = submissionTracker.get(identifier);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    // Reset or create new record
    submissionTracker.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= MAX_SUBMISSIONS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  // Try multiple headers for getting real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid feedback data', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const {
      conceptClarityScore,
      usabilityScore,
      openFeedback,
      pageUrl,
      sessionId,
      userAgent,
      referrer,
      viewportSize,
    } = validationResult.data;

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Rate limiting check
    const rateLimitIdentifier = sessionId || clientIP;
    if (!checkRateLimit(rateLimitIdentifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Prepare feedback data
    const feedbackData = {
      user_id: user?.id || null,
      session_id: user ? null : sessionId, // Only use sessionId for anonymous users
      concept_clarity_score: conceptClarityScore,
      usability_score: usabilityScore,
      open_feedback: openFeedback?.trim() || null,
      page_url: pageUrl || null,
      user_agent: userAgent || null,
      referrer: referrer || null,
      viewport_size: viewportSize || null,
      is_authenticated: !!user,
      feedback_version: 1, // Current version of the feedback form
    };

    // Insert feedback into database
    // @ts-ignore - user_feedback table not in generated types yet
    const { data, error } = await (supabase as any)
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to save feedback';
      if (error.code === '42P01') {
        errorMessage = 'Feedback table does not exist in database';
      } else if (error.code === '23505') {
        errorMessage = 'Duplicate feedback submission detected';
      } else if (error.code === '42501') {
        errorMessage = 'Permission denied - feedback system not properly configured';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          technical_details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Palaute vastaanotettu onnistuneesti!',
      success: true,
      feedbackId: data?.id,
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}