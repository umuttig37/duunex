-- ============================================================================
-- TehtäväMestari (TaskMVP) - Comprehensive Initial Schema Migration
-- ============================================================================
-- This consolidated migration creates the complete database schema for the
-- TehtäväMestari platform, a TaskRabbit-like service for Finland.
--
-- Migration Date: 2025-01-01
-- Version: 1.0.0 (Initial Comprehensive Schema)
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable PostGIS for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUMS
-- ============================================================================

-- Message type enum
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SECTION 3: CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Profiles Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'tasker', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    suspended BOOLEAN DEFAULT FALSE,

    -- Location fields
    address TEXT,
    city TEXT,
    zipcode TEXT,
    location GEOGRAPHY(Point, 4326),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

COMMENT ON TABLE profiles IS 'User profiles for all platform users (users, taskers, admins)';
COMMENT ON COLUMN profiles.role IS 'User role: user, tasker, or admin';
COMMENT ON COLUMN profiles.is_verified IS 'For taskers: whether they have been verified by admin';
COMMENT ON COLUMN profiles.suspended IS 'When true, user is suspended and cannot access the platform';
COMMENT ON COLUMN profiles.updated_at IS 'Automatically updated when profile is modified';

-- -----------------------------------------------------------------------------
-- Categories Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_fi TEXT NOT NULL,
    name_en TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_fi TEXT,
    icon_url TEXT,
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);

COMMENT ON TABLE categories IS 'Service categories with hierarchical support';

-- -----------------------------------------------------------------------------
-- Category Specific Questions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_specific_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    question_text_fi TEXT NOT NULL,
    question_text_en TEXT,
    question_type TEXT NOT NULL CHECK (question_type IN ('text', 'textarea', 'number', 'select_single', 'select_multiple', 'checkbox', 'date', 'time', 'time_range')),
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    options_fi JSONB,
    options_en JSONB,
    helper_text_fi TEXT,
    helper_text_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_questions_category ON category_specific_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_category_questions_order ON category_specific_questions(category_id, display_order);

COMMENT ON TABLE category_specific_questions IS 'Dynamic category-specific questions for enhanced task booking';

-- -----------------------------------------------------------------------------
-- Tasks Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_tasker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Task details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(10,2),
    status TEXT DEFAULT 'pending_review' CHECK (status IN (
        'pending_review',   -- Task submitted, awaiting admin approval
        'open',             -- Task approved and open for offers
        'assigned',         -- Task assigned to specific tasker
        'request_sent',     -- Direct request sent to tasker
        'request_declined', -- Tasker declined direct request
        'paid',             -- Payment completed, work can begin
        'in_progress',      -- Task is actively being worked on
        'completed',        -- Task finished and confirmed
        'early_completed',  -- Task finished early, awaiting confirmation
        'cancelled',        -- Task was cancelled
        'disputed',         -- There is a dispute about the task
        'rejected'          -- Task rejected by admin
    )),
    posting_type TEXT CHECK (posting_type IN ('direct', 'open')),

    -- Location details
    location_text TEXT NOT NULL,
    location_coordinates GEOGRAPHY(Point, 4326),
    latitude DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(location_coordinates::geometry)) STORED,
    longitude DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(location_coordinates::geometry)) STORED,

    -- Scheduling
    scheduled_date DATE,
    scheduled_time_slot TEXT CHECK (scheduled_time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),

    -- Media
    image_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_tasker_id ON tasks(assigned_tasker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_posting_type ON tasks(posting_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_location_coords ON tasks USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_tasks_pending_review ON tasks(status, created_at DESC) WHERE status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_tasks_open_posting ON tasks(status, posting_type, created_at DESC) WHERE status = 'open' AND posting_type = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_status_posting_approved ON tasks(status, posting_type, created_at DESC) WHERE status = 'open' AND posting_type = 'open';

COMMENT ON TABLE tasks IS 'Tasks posted by users for taskers to complete';
COMMENT ON COLUMN tasks.status IS 'Current task status with admin approval workflow';
COMMENT ON COLUMN tasks.posting_type IS 'direct: user selects specific tasker, open: taskers make offers';
COMMENT ON COLUMN tasks.latitude IS 'Derived from location_coordinates (SRID 4326). Preferred canonical source is location_coordinates.';
COMMENT ON COLUMN tasks.longitude IS 'Derived from location_coordinates (SRID 4326). Preferred canonical source is location_coordinates.';

-- -----------------------------------------------------------------------------
-- Task Specific Answers Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_specific_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES category_specific_questions(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_answers_task ON task_specific_answers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_answers_question ON task_specific_answers(question_id);

COMMENT ON TABLE task_specific_answers IS 'Stores user answers to category-specific questions for each task';

-- -----------------------------------------------------------------------------
-- Task Attachments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

COMMENT ON TABLE task_attachments IS 'File attachments for tasks';

-- ============================================================================
-- SECTION 4: TASKER SYSTEM TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tasker Applications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasker_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'not_approved')) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasker_applications_profile ON tasker_applications(profile_id);
CREATE INDEX IF NOT EXISTS idx_tasker_applications_status ON tasker_applications(status);

COMMENT ON TABLE tasker_applications IS 'Tracks tasker application status for admin review';

-- -----------------------------------------------------------------------------
-- Tasker Details Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasker_details (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(10,2) NOT NULL,
    service_radius_meters INTEGER NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    availability_schedule JSONB
);

CREATE INDEX IF NOT EXISTS idx_tasker_details_location ON tasker_details USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_tasker_details_hourly_rate ON tasker_details(hourly_rate);

COMMENT ON TABLE tasker_details IS 'Extended details for tasker profiles';
COMMENT ON COLUMN tasker_details.service_radius_meters IS 'Maximum distance tasker is willing to travel';

-- -----------------------------------------------------------------------------
-- Tasker Categories Table (Junction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasker_categories (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_tasker_categories_profile ON tasker_categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_tasker_categories_category ON tasker_categories(category_id);

COMMENT ON TABLE tasker_categories IS 'Links taskers to the categories they serve';

-- ============================================================================
-- SECTION 5: TASK OFFERS AND COUNTER OFFERS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Task Offers Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tasker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offered_price NUMERIC(10,2) NOT NULL,
    original_offered_price NUMERIC(10,2),
    message TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'accepted',
        'declined',
        'withdrawn',
        'counter_offered',
        'awaiting_counter_response'
    )) DEFAULT 'pending',

    -- Counter offer fields
    is_counter_offer BOOLEAN DEFAULT FALSE,
    original_offer_id UUID REFERENCES task_offers(id) ON DELETE CASCADE,
    counter_offer_reason TEXT,

    -- Scheduling
    proposed_date DATE,
    proposed_time_slot TEXT CHECK (proposed_time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for task offers
CREATE INDEX IF NOT EXISTS idx_task_offers_task_id ON task_offers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_offers_tasker_id ON task_offers(tasker_id);
CREATE INDEX IF NOT EXISTS idx_task_offers_status ON task_offers(status);
CREATE INDEX IF NOT EXISTS idx_task_offers_original_offer_id ON task_offers(original_offer_id);
CREATE INDEX IF NOT EXISTS idx_task_offers_is_counter_offer ON task_offers(is_counter_offer);

-- Create unique constraint for original offers only
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_offers_original_unique
    ON task_offers(task_id, tasker_id)
    WHERE is_counter_offer = FALSE OR is_counter_offer IS NULL;

COMMENT ON TABLE task_offers IS 'Offers made by taskers for tasks, including counter offers';
COMMENT ON COLUMN task_offers.is_counter_offer IS 'TRUE if this is a counter offer from user to tasker';
COMMENT ON COLUMN task_offers.original_offer_id IS 'References the original offer if this is a counter offer';

-- ============================================================================
-- SECTION 6: MESSAGING SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Messages Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type message_type DEFAULT 'text',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

COMMENT ON TABLE messages IS 'Task-based messaging between users and taskers';
COMMENT ON COLUMN messages.image_url IS 'URL to image stored in Supabase Storage for image messages';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text or image';

-- ============================================================================
-- SECTION 7: NOTIFICATIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    related_offer_id UUID REFERENCES task_offers(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

COMMENT ON TABLE notifications IS 'In-app notifications for users and taskers';

-- ============================================================================
-- SECTION 8: PAYMENT SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Payments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES task_offers(id) ON DELETE SET NULL,

    -- Payment amounts
    amount NUMERIC(10,2) NOT NULL,
    original_amount NUMERIC(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

    -- Platform fee (3% system)
    platform_fee_percentage NUMERIC(5,2) DEFAULT 3.00,
    platform_fee_amount NUMERIC(10,2),
    tasker_payout_amount NUMERIC(10,2),
    fee_calculation_method TEXT DEFAULT 'percentage',
    is_fee_processed BOOLEAN DEFAULT FALSE,

    -- Payment provider details
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL DEFAULT 'paytrail',
    paytrail_transaction_id TEXT,
    raw_response JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_offer_id ON payments(offer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_fee_processed ON payments(is_fee_processed, status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at) WHERE processed_at IS NOT NULL;

COMMENT ON TABLE payments IS 'Payment transactions processed through Paytrail';
COMMENT ON COLUMN payments.amount IS 'Total amount user paid (same as original_amount - no additional fee charged to user)';
COMMENT ON COLUMN payments.platform_fee_amount IS '3% platform fee collected from the payment';
COMMENT ON COLUMN payments.tasker_payout_amount IS 'Amount that will be paid to tasker (original_amount - platform_fee_amount)';
COMMENT ON COLUMN payments.offer_id IS 'Foreign key to task_offers table. Links payment to the specific offer that was accepted and triggered this payment.';

-- -----------------------------------------------------------------------------
-- Admin Revenue Tracking Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_revenue_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tasker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Revenue tracking
    platform_fee_collected NUMERIC(10,2) NOT NULL,
    collection_date TIMESTAMPTZ DEFAULT NOW(),
    revenue_category TEXT DEFAULT 'task_completion',
    payment_status TEXT NOT NULL,

    -- Additional metadata
    original_task_budget NUMERIC(10,2),
    effective_fee_percentage NUMERIC(5,2),
    revenue_processing_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin revenue tracking
CREATE INDEX IF NOT EXISTS idx_admin_revenue_tracking_payment_id ON admin_revenue_tracking(payment_id);
CREATE INDEX IF NOT EXISTS idx_admin_revenue_tracking_collection_date ON admin_revenue_tracking(collection_date);
CREATE INDEX IF NOT EXISTS idx_admin_revenue_tracking_user_id ON admin_revenue_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_revenue_tracking_tasker_id ON admin_revenue_tracking(tasker_id);

COMMENT ON TABLE admin_revenue_tracking IS 'Tracks platform revenue from the 3% fee system for comprehensive admin analytics';

-- ============================================================================
-- SECTION 9: TASKER FINANCIAL SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Tasker Balance Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasker_balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tasker_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    current_balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    total_earned NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    total_withdrawn NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    pending_withdrawals NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tasker balance
CREATE INDEX IF NOT EXISTS idx_tasker_balance_tasker_id ON tasker_balance(tasker_id);

COMMENT ON TABLE tasker_balance IS 'Tracks tasker earnings, withdrawals, and current balance';
COMMENT ON COLUMN tasker_balance.pending_withdrawals IS 'Amount currently reserved for pending withdrawal requests. This amount is deducted from current_balance when withdrawal request is made, and moved to total_withdrawn when request is completed by admin.';

-- -----------------------------------------------------------------------------
-- Bank Account Info Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_account_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tasker_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    bic VARCHAR(11) NOT NULL,
    bank_name VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for bank account info
CREATE INDEX IF NOT EXISTS idx_bank_account_info_tasker_id ON bank_account_info(tasker_id);

COMMENT ON TABLE bank_account_info IS 'Stores tasker bank account information for withdrawals';

-- -----------------------------------------------------------------------------
-- Withdrawal Requests Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tasker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    request_message TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Create indexes for withdrawal requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_tasker_id ON withdrawal_requests(tasker_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

COMMENT ON TABLE withdrawal_requests IS 'Tasker withdrawal requests processed by admins';

-- -----------------------------------------------------------------------------
-- Balance Transactions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tasker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    withdrawal_request_id UUID REFERENCES withdrawal_requests(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earnings', 'withdrawal', 'adjustment', 'refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for balance transactions
CREATE INDEX IF NOT EXISTS idx_balance_transactions_tasker_id ON balance_transactions(tasker_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_task_id ON balance_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_payment_id ON balance_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_withdrawal_id ON balance_transactions(withdrawal_request_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at DESC);

COMMENT ON TABLE balance_transactions IS 'Detailed transaction history for tasker balances';

-- -----------------------------------------------------------------------------
-- User Transactions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    amount NUMERIC(10,2),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'assignment', 'completion', 'cancellation', 'refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user transactions
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_task_id ON user_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_type ON user_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at DESC);

COMMENT ON TABLE user_transactions IS 'Transaction history for users (task payments, assignments, etc.)';

-- ============================================================================
-- SECTION 10: ADMIN AND REVIEW SYSTEM
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Task Approvals Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for task approvals
CREATE INDEX IF NOT EXISTS idx_task_approvals_status ON task_approvals(status);
CREATE INDEX IF NOT EXISTS idx_task_approvals_submitted_at ON task_approvals(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_approvals_reviewed_by ON task_approvals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_task_approvals_task_id ON task_approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_approved ON task_approvals(task_id, status) WHERE status = 'approved';

COMMENT ON TABLE task_approvals IS 'Manages admin approval workflow for newly submitted tasks';
COMMENT ON COLUMN task_approvals.status IS 'Approval status: pending, approved, rejected';

-- -----------------------------------------------------------------------------
-- Reviews Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

COMMENT ON TABLE reviews IS 'User and tasker reviews for completed tasks';

-- ============================================================================
-- SECTION 11: SUPPORT AND FEEDBACK TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Support Tickets Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Contact information
    name TEXT NOT NULL,
    email TEXT NOT NULL,

    -- Ticket details
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),

    -- Admin response
    admin_response TEXT,
    admin_id UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

COMMENT ON TABLE support_tickets IS 'Support tickets submitted by users for admin assistance';

-- -----------------------------------------------------------------------------
-- User Feedback Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Main feedback questions
    concept_clarity_score INTEGER CHECK (concept_clarity_score >= 0 AND concept_clarity_score <= 10),
    usability_score INTEGER CHECK (usability_score >= 0 AND usability_score <= 10),
    open_feedback TEXT,

    -- Context metadata
    page_url TEXT,
    user_agent TEXT,
    referrer TEXT,
    viewport_size TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Admin management fields
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,

    -- Additional metadata
    is_authenticated BOOLEAN DEFAULT FALSE,
    feedback_version INTEGER DEFAULT 1
);

-- Create indexes for user feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_concept_score ON user_feedback(concept_clarity_score);
CREATE INDEX IF NOT EXISTS idx_user_feedback_usability_score ON user_feedback(usability_score);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON user_feedback(session_id) WHERE session_id IS NOT NULL;

COMMENT ON TABLE user_feedback IS 'Stores user feedback about TaskMVP platform including concept clarity scores and open feedback';

-- ============================================================================
-- SECTION 12: TASK TEMPLATES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Task Templates Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_fi TEXT NOT NULL,
    name_en TEXT,
    description_fi TEXT,
    description_en TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    keywords_fi TEXT[],
    keywords_en TEXT[],
    questions JSONB NOT NULL DEFAULT '[]',
    popularity_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for task templates
CREATE INDEX IF NOT EXISTS idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_subcategory_id ON task_templates(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_keywords_fi ON task_templates USING GIN(keywords_fi);
CREATE INDEX IF NOT EXISTS idx_task_templates_name_fi ON task_templates(name_fi);
CREATE INDEX IF NOT EXISTS idx_task_templates_popularity ON task_templates(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active) WHERE is_active = TRUE;

-- Add full-text search index for Finnish names and descriptions
CREATE INDEX IF NOT EXISTS idx_task_templates_fulltext_fi ON task_templates
    USING GIN(to_tsvector('finnish', COALESCE(name_fi, '') || ' ' || COALESCE(description_fi, '')));

COMMENT ON TABLE task_templates IS 'Stores predefined task form templates for hero search bar functionality';
COMMENT ON COLUMN task_templates.keywords_fi IS 'Array of Finnish keywords for search functionality';
COMMENT ON COLUMN task_templates.questions IS 'JSONB array of dynamic form questions with types, labels, and validation';
COMMENT ON COLUMN task_templates.popularity_score IS 'Score used for ranking search results, higher = more popular';

-- ============================================================================
-- SECTION 13: OVERDUE TASK MANAGEMENT
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Overdue Task Actions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS overdue_task_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    overdue_type TEXT NOT NULL CHECK (overdue_type IN ('payment_overdue', 'completion_overdue', 'early_completion_overdue')),
    action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'status_change', 'auto_cancel', 'admin_review')),
    previous_status TEXT NOT NULL,
    new_status TEXT,
    hours_overdue NUMERIC NOT NULL,
    notification_sent BOOLEAN DEFAULT FALSE,
    action_notes TEXT,
    action_taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for overdue task actions
CREATE INDEX IF NOT EXISTS idx_overdue_actions_task_id ON overdue_task_actions(task_id);
CREATE INDEX IF NOT EXISTS idx_overdue_actions_overdue_type ON overdue_task_actions(overdue_type);
CREATE INDEX IF NOT EXISTS idx_overdue_actions_action_type ON overdue_task_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_overdue_actions_taken_at ON overdue_task_actions(action_taken_at DESC);

COMMENT ON TABLE overdue_task_actions IS 'Tracks automated actions taken on overdue tasks';

-- ============================================================================
-- SECTION 14: TRIGGERS AND FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Updated At Triggers
-- -----------------------------------------------------------------------------

-- Generic updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_offers_updated_at
    BEFORE UPDATE ON task_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_approvals_updated_at
    BEFORE UPDATE ON task_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_questions_updated_at
    BEFORE UPDATE ON category_specific_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_answers_updated_at
    BEFORE UPDATE ON task_specific_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Notification Creation Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
    recipient_id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    related_task_id UUID DEFAULT NULL,
    related_offer_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (recipient_id, type, title, message, related_task_id, related_offer_id)
    VALUES (recipient_id, type, title, message, related_task_id, related_offer_id)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';

-- -----------------------------------------------------------------------------
-- Counter Offer Functions
-- -----------------------------------------------------------------------------

-- Create counter offer function
CREATE OR REPLACE FUNCTION create_counter_offer(
    original_offer_id_param UUID,
    new_price NUMERIC,
    counter_reason TEXT,
    counter_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    original_offer RECORD;
    counter_offer_id UUID;
    task_owner_id UUID;
BEGIN
    -- Get original offer details
    SELECT * INTO original_offer
    FROM task_offers
    WHERE id = original_offer_id_param AND is_counter_offer = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original offer not found';
    END IF;

    -- Get task owner
    SELECT user_id INTO task_owner_id
    FROM tasks
    WHERE id = original_offer.task_id;

    -- Update original offer status
    UPDATE task_offers
    SET status = 'counter_offered', updated_at = NOW()
    WHERE id = original_offer_id_param;

    -- Create counter offer with same tasker_id as original
    INSERT INTO task_offers (
        task_id,
        tasker_id,
        offered_price,
        message,
        status,
        is_counter_offer,
        original_offer_id,
        counter_offer_reason,
        proposed_date,
        proposed_time_slot
    ) VALUES (
        original_offer.task_id,
        original_offer.tasker_id,
        new_price,
        counter_message,
        'awaiting_counter_response',
        TRUE,
        original_offer_id_param,
        counter_reason,
        original_offer.proposed_date,
        original_offer.proposed_time_slot
    ) RETURNING id INTO counter_offer_id;

    -- Create notification for tasker
    PERFORM create_notification(
        original_offer.tasker_id,
        'counter_offer_received',
        'Vastaehdotus saatu',
        'Asiakas on tehnyt vastaehdotuksen tarjoukseesi: ' || new_price || '€',
        original_offer.task_id,
        counter_offer_id
    );

    RETURN counter_offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_counter_offer IS 'Creates a counter offer from user to tasker. Counter offer keeps same tasker_id as original for easy querying.';

-- Respond to counter offer function
CREATE OR REPLACE FUNCTION respond_to_counter_offer(
    counter_offer_id_param UUID,
    response_status TEXT,
    new_counter_price NUMERIC DEFAULT NULL,
    response_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    counter_offer RECORD;
    original_offer RECORD;
    task_owner_id UUID;
BEGIN
    -- Validate response status
    IF response_status NOT IN ('accepted', 'declined') THEN
        RAISE EXCEPTION 'Invalid response status. Must be accepted or declined';
    END IF;

    -- Get counter offer details
    SELECT * INTO counter_offer
    FROM task_offers
    WHERE id = counter_offer_id_param AND is_counter_offer = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Counter offer not found';
    END IF;

    -- Get original offer
    SELECT * INTO original_offer
    FROM task_offers
    WHERE id = counter_offer.original_offer_id;

    -- Get task owner
    SELECT user_id INTO task_owner_id
    FROM tasks
    WHERE id = counter_offer.task_id;

    -- Update counter offer status
    UPDATE task_offers
    SET status = response_status, updated_at = NOW()
    WHERE id = counter_offer_id_param;

    IF response_status = 'accepted' THEN
        -- Update original offer with counter offer price and set to accepted
        -- CRITICAL FIX: Changed from 'pending' to 'accepted' to enable payment flow
        UPDATE task_offers
        SET
            offered_price = counter_offer.offered_price,
            status = 'accepted',
            updated_at = NOW()
        WHERE id = counter_offer.original_offer_id;
    ELSE
        -- If declined, revert original offer to pending
        UPDATE task_offers
        SET status = 'pending', updated_at = NOW()
        WHERE id = counter_offer.original_offer_id;
    END IF;

    -- Create notification for task owner
    PERFORM create_notification(
        task_owner_id,
        CASE WHEN response_status = 'accepted' THEN 'counter_offer_accepted' ELSE 'counter_offer_declined' END,
        CASE WHEN response_status = 'accepted' THEN 'Vastaehdotus hyväksytty' ELSE 'Vastaehdotus hylätty' END,
        CASE
            WHEN response_status = 'accepted' THEN 'Tekijä hyväksyi vastaehdotuksesi!'
            ELSE 'Tekijä hylkäsi vastaehdotuksesi.'
        END,
        counter_offer.task_id,
        counter_offer_id_param
    );

    RETURN counter_offer_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION respond_to_counter_offer IS 'Allows tasker to accept or decline counter offer';

-- -----------------------------------------------------------------------------
-- Geospatial Functions (PostGIS)
-- -----------------------------------------------------------------------------

-- Find nearby taskers based on location and category
-- Uses PostGIS geography for accurate distance calculations
CREATE OR REPLACE FUNCTION find_nearby_taskers(
  task_lon double precision,
  task_lat double precision,
  search_radius_meters integer,
  target_category_id uuid
)
RETURNS TABLE (
  profile_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  role text,
  is_verified boolean,
  hourly_rate numeric,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id as profile_id,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.bio,
      p.role,
      p.is_verified,
      COALESCE(td.hourly_rate, 25) as hourly_rate,
      ST_Distance(td.location::geography, ST_SetSRID(ST_MakePoint(task_lon, task_lat), 4326)::geography) as distance_meters
    FROM profiles p
    INNER JOIN tasker_details td ON p.id = td.profile_id
    INNER JOIN tasker_categories tc ON p.id = tc.profile_id
    WHERE
      td.location IS NOT NULL AND -- Ensure tasker has a location in tasker_details
      p.role = 'tasker' AND -- Only taskers
      p.is_verified = true AND -- Only verified taskers
      ST_DWithin(
        td.location::geography,
        ST_SetSRID(ST_MakePoint(task_lon, task_lat), 4326)::geography,
        search_radius_meters
      ) AND
      tc.category_id = target_category_id -- Filter by category (required)
    ORDER BY distance_meters ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION find_nearby_taskers(double precision, double precision, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_taskers(double precision, double precision, integer, uuid) TO anon;

COMMENT ON FUNCTION find_nearby_taskers IS 'Finds verified taskers near a location within specified radius for a given category';

-- Update tasker location with PostGIS geometry
-- Handles location updates from dashboard
CREATE OR REPLACE FUNCTION update_tasker_location(
  tasker_id uuid,
  longitude double precision,
  latitude double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert tasker location
  INSERT INTO tasker_details (profile_id, location, hourly_rate, service_radius_meters)
  VALUES (
    tasker_id,
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    25, -- default hourly rate
    5000 -- default 5km radius
  )
  ON CONFLICT (profile_id)
  DO UPDATE SET
    location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography;
END;
$$;

GRANT EXECUTE ON FUNCTION update_tasker_location(uuid, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION update_tasker_location(uuid, double precision, double precision) TO anon;

COMMENT ON FUNCTION update_tasker_location IS 'Updates or creates tasker location with PostGIS geometry';

-- -----------------------------------------------------------------------------
-- Task Approval Functions
-- -----------------------------------------------------------------------------

-- Create task approval record function
CREATE OR REPLACE FUNCTION create_task_approval_record(p_task_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO task_approvals (task_id, status)
    VALUES (p_task_id, 'pending')
    ON CONFLICT (task_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task approval on task creation
CREATE OR REPLACE FUNCTION create_task_approval_on_task_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create approval record for new tasks with 'pending_review' status
    IF NEW.status = 'pending_review' THEN
        PERFORM create_task_approval_record(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_task_approval_on_task_creation
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_task_approval_on_task_creation();

-- Process task approval function
CREATE OR REPLACE FUNCTION process_task_approval(
    task_approval_id UUID,
    admin_id UUID,
    approval_status TEXT,
    admin_notes TEXT DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    approval_record task_approvals%ROWTYPE;
    task_record tasks%ROWTYPE;
BEGIN
    -- Validate approval_status
    IF approval_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid approval status: %. Must be "approved" or "rejected"', approval_status;
    END IF;

    -- Get the approval record
    SELECT * INTO approval_record FROM task_approvals WHERE id = task_approval_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task approval record not found';
    END IF;

    -- Get the task record
    SELECT * INTO task_record FROM tasks WHERE id = approval_record.task_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated task not found';
    END IF;

    -- Check if already processed
    IF approval_record.status != 'pending' THEN
        RAISE EXCEPTION 'Task approval already processed with status: %', approval_record.status;
    END IF;

    -- Update approval record
    UPDATE task_approvals
    SET
        status = approval_status,
        reviewed_by = admin_id,
        reviewed_at = NOW(),
        admin_notes = process_task_approval.admin_notes,
        rejection_reason = CASE
            WHEN approval_status = 'rejected' THEN process_task_approval.rejection_reason
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = task_approval_id;

    -- Update task status based on approval decision
    IF approval_status = 'approved' THEN
        UPDATE tasks
        SET status = CASE
            WHEN posting_type = 'open' THEN 'open'
            WHEN posting_type = 'direct' THEN 'request_sent'
            ELSE 'open'
        END,
        updated_at = NOW()
        WHERE id = approval_record.task_id;

        -- Create notification for user about approval
        INSERT INTO notifications (
            recipient_id,
            type,
            title,
            message,
            related_task_id
        ) VALUES (
            task_record.user_id,
            'task_approved',
            'Tehtäväsi hyväksyttiin',
            'Tehtäväsi "' || task_record.title || '" on hyväksytty ja julkaistu.',
            task_record.id
        );

    ELSIF approval_status = 'rejected' THEN
        UPDATE tasks
        SET status = 'rejected',
        updated_at = NOW()
        WHERE id = approval_record.task_id;

        -- Create notification for user about rejection
        INSERT INTO notifications (
            recipient_id,
            type,
            title,
            message,
            related_task_id
        ) VALUES (
            task_record.user_id,
            'task_rejected',
            'Tehtäväsi hylättiin',
            'Tehtäväsi "' || task_record.title || '" hylättiin. ' ||
            CASE WHEN process_task_approval.rejection_reason IS NOT NULL
                 THEN 'Syy: ' || process_task_approval.rejection_reason
                 ELSE ''
            END,
            task_record.id
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_task_approval IS 'Processes admin approval/rejection of tasks';

-- -----------------------------------------------------------------------------
-- Withdrawal Functions
-- -----------------------------------------------------------------------------

-- Create withdrawal request with immediate deduction
CREATE OR REPLACE FUNCTION create_withdrawal_request_with_deduction(
    p_tasker_id UUID,
    p_amount NUMERIC(10,2),
    p_request_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_current_balance NUMERIC(10,2);
BEGIN
    -- Check current available balance
    SELECT current_balance INTO v_current_balance
    FROM tasker_balance
    WHERE tasker_id = p_tasker_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tasker balance not found';
    END IF;

    -- Check if sufficient balance available
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient available balance. Available: %, Requested: %', v_current_balance, p_amount;
    END IF;

    -- Create withdrawal request
    INSERT INTO withdrawal_requests (tasker_id, amount, request_message, status)
    VALUES (p_tasker_id, p_amount, p_request_message, 'pending')
    RETURNING id INTO v_request_id;

    -- Immediately update balance - move amount from current_balance to pending_withdrawals
    UPDATE tasker_balance
    SET
        current_balance = current_balance - p_amount,
        pending_withdrawals = pending_withdrawals + p_amount,
        updated_at = NOW()
    WHERE tasker_id = p_tasker_id;

    -- Record the transaction as pending withdrawal
    INSERT INTO balance_transactions (tasker_id, withdrawal_request_id, amount, transaction_type, description)
    VALUES (p_tasker_id, v_request_id, -p_amount, 'withdrawal', 'Nostopyyntö luotu - saldo varattu');

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_withdrawal_request_with_deduction IS 'Creates withdrawal request and immediately deducts amount from available balance';

-- Process withdrawal request function
CREATE OR REPLACE FUNCTION process_withdrawal_request(
    request_id UUID,
    new_status VARCHAR(20),
    admin_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record withdrawal_requests%ROWTYPE;
    tasker_balance_record tasker_balance%ROWTYPE;
BEGIN
    -- Get the withdrawal request
    SELECT * INTO request_record FROM withdrawal_requests WHERE id = request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    -- Get current tasker balance
    SELECT * INTO tasker_balance_record FROM tasker_balance WHERE tasker_id = request_record.tasker_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tasker balance not found';
    END IF;

    -- Update withdrawal request
    UPDATE withdrawal_requests
    SET
        status = new_status,
        processed_by = admin_id,
        admin_notes = COALESCE(process_withdrawal_request.admin_notes, withdrawal_requests.admin_notes),
        processed_at = CASE WHEN new_status != 'pending' THEN NOW() ELSE processed_at END,
        completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = request_id;

    -- Handle balance changes based on new status
    IF new_status = 'completed' THEN
        -- Move from pending_withdrawals to total_withdrawn
        UPDATE tasker_balance
        SET
            pending_withdrawals = pending_withdrawals - request_record.amount,
            total_withdrawn = total_withdrawn + request_record.amount,
            updated_at = NOW()
        WHERE tasker_id = request_record.tasker_id;

        -- Update transaction description
        UPDATE balance_transactions
        SET description = 'Nostopyyntö hyväksytty - raha siirretty'
        WHERE withdrawal_request_id = request_id;

    ELSIF new_status = 'rejected' THEN
        -- Return money from pending_withdrawals back to current_balance
        UPDATE tasker_balance
        SET
            current_balance = current_balance + request_record.amount,
            pending_withdrawals = pending_withdrawals - request_record.amount,
            updated_at = NOW()
        WHERE tasker_id = request_record.tasker_id;

        -- Add transaction record for refund
        INSERT INTO balance_transactions (tasker_id, withdrawal_request_id, amount, transaction_type, description)
        VALUES (request_record.tasker_id, request_id, request_record.amount, 'adjustment', 'Nostopyyntö hylätty - saldo palautettu');
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_withdrawal_request IS 'Processes withdrawal request approval/rejection by admin';

-- -----------------------------------------------------------------------------
-- Payment Fee Calculation Functions (3% System)
-- -----------------------------------------------------------------------------

-- Calculate payment fees function
CREATE OR REPLACE FUNCTION calculate_payment_fees_3_percent(
    original_amount NUMERIC(10,2),
    fee_percentage NUMERIC(5,2) DEFAULT 3.00,
    calculation_method TEXT DEFAULT 'percentage'
)
RETURNS TABLE (
    user_pays_amount NUMERIC(10,2),
    platform_fee_amount NUMERIC(10,2),
    tasker_receives_amount NUMERIC(10,2),
    effective_fee_percentage NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    calculated_fee NUMERIC(10,2);
    tasker_amount NUMERIC(10,2);
BEGIN
    -- Validate input
    IF original_amount <= 0 THEN
        RAISE EXCEPTION 'Original amount must be positive, got: %', original_amount;
    END IF;

    IF fee_percentage < 0 OR fee_percentage > 50 THEN
        RAISE EXCEPTION 'Fee percentage must be between 0 and 50, got: %', fee_percentage;
    END IF;

    -- Calculate platform fee (3% of original amount)
    calculated_fee := ROUND(original_amount * (fee_percentage / 100.0), 2);

    -- Calculate tasker payout (original amount - platform fee)
    tasker_amount := original_amount - calculated_fee;

    -- Ensure tasker amount is not negative
    IF tasker_amount < 0 THEN
        tasker_amount := 0;
        calculated_fee := original_amount;
    END IF;

    -- Return calculated amounts
    RETURN QUERY
    SELECT
        original_amount as user_pays_amount,
        calculated_fee as platform_fee_amount,
        tasker_amount as tasker_receives_amount,
        CASE
            WHEN original_amount > 0 THEN ROUND((calculated_fee / original_amount * 100), 2)
            ELSE 0.00
        END as effective_fee_percentage;
END;
$$;

COMMENT ON FUNCTION calculate_payment_fees_3_percent IS 'Calculates 3% platform fee structure: user pays original amount, platform takes 3%, tasker gets 97%';

-- Process payment with 3% fee function
CREATE OR REPLACE FUNCTION process_payment_with_3_percent_fee(
    payment_id UUID,
    force_reprocess BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record payments%ROWTYPE;
    fee_calculation RECORD;
    task_data RECORD;
    result JSON;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM payments WHERE id = payment_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment not found',
            'payment_id', payment_id
        );
    END IF;

    -- Skip if already processed (unless force reprocess)
    IF payment_record.is_fee_processed = TRUE AND NOT force_reprocess THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Payment already processed',
            'payment_id', payment_id,
            'skipped', true
        );
    END IF;

    -- Get task details for tasker_id
    SELECT * INTO task_data FROM tasks WHERE id = payment_record.task_id;

    -- Use payment amount as original amount if not set
    IF payment_record.original_amount IS NULL THEN
        UPDATE payments
        SET original_amount = amount
        WHERE id = payment_id;
        payment_record.original_amount := payment_record.amount;
    END IF;

    -- Calculate fees using the 3% system
    SELECT * INTO fee_calculation
    FROM calculate_payment_fees_3_percent(
        payment_record.original_amount,
        COALESCE(payment_record.platform_fee_percentage, 3.00)
    );

    -- Update payment record with calculated fees
    UPDATE payments SET
        platform_fee_amount = fee_calculation.platform_fee_amount,
        tasker_payout_amount = fee_calculation.tasker_receives_amount,
        is_fee_processed = TRUE,
        processed_at = CASE WHEN payment_record.status = 'paid' THEN NOW() ELSE processed_at END,
        updated_at = NOW()
    WHERE id = payment_id;

    -- If payment is completed, record revenue tracking
    IF payment_record.status = 'paid' THEN
        INSERT INTO admin_revenue_tracking (
            payment_id,
            task_id,
            user_id,
            tasker_id,
            platform_fee_collected,
            collection_date,
            revenue_category,
            payment_status,
            original_task_budget,
            effective_fee_percentage,
            revenue_processing_notes
        ) VALUES (
            payment_id,
            payment_record.task_id,
            payment_record.user_id,
            task_data.assigned_tasker_id,
            fee_calculation.platform_fee_amount,
            NOW(),
            'task_completion',
            payment_record.status,
            payment_record.original_amount,
            fee_calculation.effective_fee_percentage,
            format('3%% platform fee processed for task payment of %s€', payment_record.original_amount)
        )
        ON CONFLICT (payment_id) DO UPDATE SET
            platform_fee_collected = fee_calculation.platform_fee_amount,
            effective_fee_percentage = fee_calculation.effective_fee_percentage,
            updated_at = NOW();
    END IF;

    -- Return success result
    RETURN json_build_object(
        'success', true,
        'payment_id', payment_id,
        'original_amount', payment_record.original_amount,
        'platform_fee', fee_calculation.platform_fee_amount,
        'tasker_payout', fee_calculation.tasker_receives_amount,
        'fee_percentage', fee_calculation.effective_fee_percentage,
        'revenue_tracked', payment_record.status = 'paid'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'payment_id', payment_id
        );
END;
$$;

COMMENT ON FUNCTION process_payment_with_3_percent_fee IS 'Processes payment with 3% fee calculation and updates admin revenue tracking';

-- Trigger for automatic payment fee processing
CREATE OR REPLACE FUNCTION trigger_process_payment_fees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    processing_result JSON;
BEGIN
    -- Process fees when payment becomes paid or when amount/original_amount changes
    IF (TG_OP = 'UPDATE' AND
        (OLD.status != NEW.status OR OLD.amount != NEW.amount OR OLD.original_amount != NEW.original_amount))
       OR TG_OP = 'INSERT' THEN

        -- Process fees for this payment
        SELECT process_payment_with_3_percent_fee(NEW.id, FALSE) INTO processing_result;

        -- Log any errors (but don't fail the transaction)
        IF (processing_result->>'success')::BOOLEAN != TRUE THEN
            RAISE WARNING 'Fee processing failed for payment %: %', NEW.id, processing_result->>'error';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_process_payment_fees
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_payment_fees();

-- -----------------------------------------------------------------------------
-- Tasker Balance Update Trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_tasker_balance_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    final_payment_amount NUMERIC(10,2);
    accepted_offer_price NUMERIC(10,2);
BEGIN
    -- Only proceed if task status changed to 'completed' and has assigned tasker
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_tasker_id IS NOT NULL THEN

        -- First, try to get the accepted offer price for this task
        SELECT offered_price INTO accepted_offer_price
        FROM task_offers
        WHERE task_id = NEW.id
          AND tasker_id = NEW.assigned_tasker_id
          AND status = 'accepted'
        LIMIT 1;

        -- Use accepted offer price if available, otherwise fall back to budget
        IF accepted_offer_price IS NOT NULL THEN
            final_payment_amount := accepted_offer_price;
        ELSIF NEW.budget IS NOT NULL THEN
            final_payment_amount := NEW.budget;
        ELSE
            -- No payment amount available, skip update
            RETURN NEW;
        END IF;

        -- Insert or update tasker balance using final payment amount
        INSERT INTO tasker_balance (tasker_id, current_balance, total_earned)
        VALUES (NEW.assigned_tasker_id, final_payment_amount, final_payment_amount)
        ON CONFLICT (tasker_id)
        DO UPDATE SET
            current_balance = tasker_balance.current_balance + final_payment_amount,
            total_earned = tasker_balance.total_earned + final_payment_amount,
            updated_at = NOW();

        -- Record the transaction with final payment amount
        INSERT INTO balance_transactions (tasker_id, task_id, amount, transaction_type, description)
        VALUES (NEW.assigned_tasker_id, NEW.id, final_payment_amount, 'earnings',
                'Task completion payment: ' || NEW.title ||
                CASE
                    WHEN accepted_offer_price IS NOT NULL THEN ' (final agreed price: ' || final_payment_amount || '€)'
                    ELSE ' (budget: ' || final_payment_amount || '€)'
                END);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasker_balance_on_task_completion
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasker_balance_on_task_completion();

-- -----------------------------------------------------------------------------
-- User Transaction Triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_user_transaction_on_task_update()
RETURNS TRIGGER AS $$
DECLARE
    final_payment_amount NUMERIC(10,2);
    accepted_offer_price NUMERIC(10,2);
BEGIN
    -- When task is paid
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        SELECT offered_price INTO accepted_offer_price
        FROM task_offers
        WHERE task_id = NEW.id
          AND tasker_id = NEW.assigned_tasker_id
          AND status = 'accepted'
        LIMIT 1;

        IF accepted_offer_price IS NOT NULL THEN
            final_payment_amount := accepted_offer_price;
        ELSIF NEW.budget IS NOT NULL THEN
            final_payment_amount := NEW.budget;
        ELSE
            final_payment_amount := NULL;
        END IF;

        IF final_payment_amount IS NOT NULL THEN
            INSERT INTO user_transactions (user_id, task_id, amount, transaction_type, description)
            VALUES (NEW.user_id, NEW.id, final_payment_amount, 'payment',
                    'Maksu tehtävästä: ' || NEW.title ||
                    CASE
                        WHEN accepted_offer_price IS NOT NULL THEN ' (final agreed price: ' || final_payment_amount || '€)'
                        ELSE ' (budget: ' || final_payment_amount || '€)'
                    END);
        END IF;
    END IF;

    -- When task is assigned
    IF NEW.status = 'assigned' AND OLD.status != 'assigned' AND NEW.assigned_tasker_id IS NOT NULL THEN
        INSERT INTO user_transactions (user_id, task_id, amount, transaction_type, description)
        VALUES (NEW.user_id, NEW.id, NULL, 'assignment', 'Tehtävä määritetty tekijälle: ' || NEW.title);
    END IF;

    -- When task is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO user_transactions (user_id, task_id, amount, transaction_type, description)
        VALUES (NEW.user_id, NEW.id, NULL, 'completion', 'Tehtävä valmistunut: ' || NEW.title);
    END IF;

    -- When task is cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        INSERT INTO user_transactions (user_id, task_id, amount, transaction_type, description)
        VALUES (NEW.user_id, NEW.id, NULL, 'cancellation', 'Tehtävä peruttu: ' || NEW.title);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_transaction_on_task_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_user_transaction_on_task_update();

-- Trigger for user feedback reviewed timestamp
CREATE OR REPLACE FUNCTION set_feedback_reviewed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'reviewed' AND OLD.status != 'reviewed' THEN
        NEW.reviewed_at = NOW();
        IF NEW.reviewed_by IS NULL THEN
            NEW.reviewed_by = auth.uid();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_reviewed_trigger
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION set_feedback_reviewed_timestamp();

-- ============================================================================
-- SECTION 15: VIEWS
-- ============================================================================

-- Admin task approval stats view
CREATE OR REPLACE VIEW admin_task_approval_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'approved' AND submitted_at >= CURRENT_DATE - INTERVAL '7 days') as approved_this_week,
    COUNT(*) FILTER (WHERE status = 'pending' AND submitted_at >= CURRENT_DATE) as pending_today,
    AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/3600) FILTER (WHERE reviewed_at IS NOT NULL) as avg_approval_time_hours
FROM task_approvals
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Pending review tasks view
CREATE OR REPLACE VIEW pending_review_tasks AS
SELECT
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.budget,
    t.location_text as location,
    t.category_id,
    c.name_fi as category_name,
    t.scheduled_date,
    t.created_at,
    p.first_name,
    p.last_name,
    p.email
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN profiles p ON t.user_id = p.id
WHERE t.status = 'pending_review';

-- Task offers with counter info view
CREATE OR REPLACE VIEW task_offers_with_counter_info AS
SELECT
    o.id,
    o.task_id,
    o.tasker_id,
    o.offered_price,
    o.message,
    o.status,
    o.created_at,
    o.updated_at,
    t.title as task_title,
    t.user_id as task_owner_id,
    p.first_name as tasker_first_name,
    p.last_name as tasker_last_name,
    co.offered_price as counter_offer_price,
    co.message as counter_offer_message
FROM task_offers o
JOIN tasks t ON o.task_id = t.id
JOIN profiles p ON o.tasker_id = p.id
LEFT JOIN task_offers co ON o.id = co.original_offer_id AND co.is_counter_offer = TRUE;

-- ============================================================================
-- SECTION 16: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasker_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasker_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_account_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasker_applications ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are extensive and complex. For a production deployment,
-- you should review the security-review.sql migration file for the complete
-- set of RLS policies. The following are essential policies only:

-- Profiles policies
CREATE POLICY "Public profiles viewable by all" ON profiles
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            role = 'tasker' AND is_verified = true
            OR id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Categories public read
CREATE POLICY "Categories are publicly readable" ON categories
    FOR SELECT
    USING (true);

-- Task templates public read
CREATE POLICY "task_templates_public_read" ON task_templates
    FOR SELECT USING (is_active = true);

-- Task approvals policies
CREATE POLICY "Users can view own task approvals" ON task_approvals
    FOR SELECT USING (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

CREATE POLICY "Allow system to create task approvals" ON task_approvals
    FOR INSERT WITH CHECK (true);

-- User feedback policies
CREATE POLICY "Anyone can submit feedback" ON user_feedback
    FOR INSERT WITH CHECK (
        (auth.uid() IS NULL AND session_id IS NOT NULL AND user_id IS NULL) OR
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- ============================================================================
-- SECTION 17: GRANTS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_counter_offer TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_counter_offer TO authenticated;
GRANT EXECUTE ON FUNCTION process_task_approval TO authenticated;
GRANT EXECUTE ON FUNCTION create_withdrawal_request_with_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_payment_fees_3_percent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_payment_with_3_percent_fee TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_task_approval_record TO authenticated;

-- ============================================================================
-- SECTION 18: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'TehtäväMestari platform - comprehensive schema with RLS, geospatial support, and payment processing';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert initial balance records for existing taskers (if any)
INSERT INTO tasker_balance (tasker_id, current_balance, total_earned, total_withdrawn)
SELECT id, 0.00, 0.00, 0.00
FROM profiles
WHERE role = 'tasker'
AND id NOT IN (SELECT tasker_id FROM tasker_balance)
ON CONFLICT (tasker_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TehtäväMestari Initial Schema Migration Complete!';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Database schema version: 1.0.0';
    RAISE NOTICE 'Extensions enabled: PostGIS, uuid-ossp';
    RAISE NOTICE 'Total tables created: 30+';
    RAISE NOTICE 'RLS enabled on all sensitive tables';
    RAISE NOTICE '3%% platform fee system configured';
    RAISE NOTICE 'Geospatial queries ready with PostGIS';
    RAISE NOTICE 'Admin approval workflow enabled';
    RAISE NOTICE 'Counter offer system configured';
    RAISE NOTICE '============================================================================';
END $$;
