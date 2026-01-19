-- Production Database Indexes for TehtäväMestari
-- These indexes are created without CONCURRENTLY to allow execution within migrations
-- Note: CONCURRENTLY would prevent blocking but cannot run in transactions

-- ============================================================================
-- TASKS TABLE INDEXES (High traffic, core entity)
-- ============================================================================

-- Primary lookup patterns: status filtering, user ownership, location searches
CREATE INDEX IF NOT EXISTS idx_tasks_status_created_at
ON tasks (status, created_at DESC)
WHERE status IN ('open', 'paid', 'in_progress', 'completed');

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status
ON tasks (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_tasker_status
ON tasks (assigned_tasker_id, status, created_at DESC)
WHERE assigned_tasker_id IS NOT NULL;

-- Geospatial index for location-based task searches (open tasks only)
CREATE INDEX IF NOT EXISTS idx_tasks_location_open
ON tasks USING GIST (location_coordinates)
WHERE status = 'open' AND location_coordinates IS NOT NULL;

-- Category-based filtering (popular search pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_category_status
ON tasks (category_id, status, created_at DESC)
WHERE status IN ('open', 'paid', 'in_progress');

-- Posting type filtering (open vs direct)
CREATE INDEX IF NOT EXISTS idx_tasks_posting_type_status
ON tasks (posting_type, status, created_at DESC)
WHERE posting_type = 'open' AND status IN ('open', 'pending_review');

-- ============================================================================
-- TASK OFFERS TABLE INDEXES (Bidding system)
-- ============================================================================

-- Primary offer lookups by task and status
CREATE INDEX IF NOT EXISTS idx_task_offers_task_id_status
ON task_offers (task_id, status, created_at DESC);

-- Tasker's offer history
CREATE INDEX IF NOT EXISTS idx_task_offers_tasker_id
ON task_offers (tasker_id, status, created_at DESC);

-- Pending offers for notifications
CREATE INDEX IF NOT EXISTS idx_task_offers_pending
ON task_offers (task_id, created_at DESC)
WHERE status = 'pending';

-- Accepted offers lookup (for payment processing)
CREATE INDEX IF NOT EXISTS idx_task_offers_accepted
ON task_offers (task_id, tasker_id, created_at DESC)
WHERE status = 'accepted';

-- ============================================================================
-- MESSAGES TABLE INDEXES (Chat system)
-- ============================================================================

-- Task-based conversations (main chat view)
CREATE INDEX IF NOT EXISTS idx_messages_task_id_created
ON messages (task_id, created_at DESC);

-- User conversation lookup
CREATE INDEX IF NOT EXISTS idx_messages_participants
ON messages (sender_profile_id, receiver_profile_id, created_at DESC);

-- Unread messages for notifications
CREATE INDEX IF NOT EXISTS idx_messages_unread
ON messages (receiver_profile_id, is_read, created_at DESC)
WHERE is_read = false;

-- Message search within task conversations
CREATE INDEX IF NOT EXISTS idx_messages_task_content
ON messages (task_id, created_at DESC)
WHERE content IS NOT NULL;

-- ============================================================================
-- PAYMENTS TABLE INDEXES (Financial tracking)
-- ============================================================================

-- User payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_id_status
ON payments (user_id, status, created_at DESC);

-- Task payment lookup
CREATE INDEX IF NOT EXISTS idx_payments_task_id
ON payments (task_id, status, created_at DESC);

-- Pending payments for processing
CREATE INDEX IF NOT EXISTS idx_payments_pending
ON payments (status, created_at ASC)
WHERE status = 'pending';

-- Paytrail transaction lookup
CREATE INDEX IF NOT EXISTS idx_payments_paytrail_tx
ON payments (paytrail_transaction_id)
WHERE paytrail_transaction_id IS NOT NULL;

-- ============================================================================
-- PROFILES TABLE INDEXES (User management)
-- ============================================================================

-- Role-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_verified
ON profiles (role, is_verified, created_at DESC)
WHERE is_verified = true;

-- Email lookup for auth
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles (email)
WHERE email IS NOT NULL;

-- Tasker verification status
CREATE INDEX IF NOT EXISTS idx_profiles_taskers_verified
ON profiles (role, is_verified, created_at DESC)
WHERE role = 'tasker';

-- ============================================================================
-- TASKER DETAILS INDEXES (Location-based searches)
-- ============================================================================

-- Primary geospatial index for nearby tasker searches
CREATE INDEX IF NOT EXISTS idx_tasker_details_location_available
ON tasker_details USING GIST (location);

-- Hourly rate filtering
CREATE INDEX IF NOT EXISTS idx_tasker_details_rate_range
ON tasker_details (hourly_rate ASC)
WHERE hourly_rate IS NOT NULL;

-- ============================================================================
-- TASKER CATEGORIES INDEXES (Skill matching)
-- ============================================================================

-- Category-based tasker searches
CREATE INDEX IF NOT EXISTS idx_tasker_categories_category_id
ON tasker_categories (category_id, profile_id);

-- Tasker's skill categories
CREATE INDEX IF NOT EXISTS idx_tasker_categories_profile_id
ON tasker_categories (profile_id, category_id);

-- ============================================================================
-- CATEGORIES TABLE INDEXES (Category browsing)
-- ============================================================================

-- Hierarchical category structure
CREATE INDEX IF NOT EXISTS idx_categories_parent_category_id
ON categories (parent_category_id, created_at ASC)
WHERE parent_category_id IS NOT NULL;

-- ============================================================================
-- TASK APPROVALS INDEXES (Admin workflow)
-- ============================================================================

-- Pending approvals for admin dashboard
CREATE INDEX IF NOT EXISTS idx_task_approvals_pending
ON task_approvals (status, submitted_at ASC)
WHERE status = 'pending';

-- Task approval lookup
CREATE INDEX IF NOT EXISTS idx_task_approvals_task_id
ON task_approvals (task_id, status);

-- Admin workflow tracking
CREATE INDEX IF NOT EXISTS idx_task_approvals_admin_status
ON task_approvals (reviewed_by, status, reviewed_at DESC)
WHERE reviewed_by IS NOT NULL;

-- ============================================================================
-- REVIEWS TABLE INDEXES (Rating system)
-- ============================================================================

-- Reviewee (tasker) rating lookup
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_rating
ON reviews (reviewee_profile_id, rating DESC, created_at DESC);

-- Reviewer (user) review history
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer
ON reviews (reviewer_profile_id, created_at DESC);

-- Task review lookup
CREATE INDEX IF NOT EXISTS idx_reviews_task_id
ON reviews (task_id, created_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES (Notification system)
-- ============================================================================

-- User notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
ON notifications (recipient_id, is_read, created_at DESC);

-- Unread notifications count
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications (recipient_id, created_at DESC)
WHERE is_read = false;

-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type
ON notifications (type, created_at DESC);

-- ============================================================================
-- BALANCE TRANSACTIONS INDEXES (Financial tracking)
-- ============================================================================

-- Tasker balance history
CREATE INDEX IF NOT EXISTS idx_balance_transactions_tasker
ON balance_transactions (tasker_id, created_at DESC);

-- Transaction type filtering
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type
ON balance_transactions (transaction_type, created_at DESC);

-- Task-related transactions
CREATE INDEX IF NOT EXISTS idx_balance_transactions_task
ON balance_transactions (task_id, created_at DESC)
WHERE task_id IS NOT NULL;

-- ============================================================================
-- TASK ATTACHMENTS INDEXES (File handling)
-- ============================================================================

-- Task attachment lookup
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
ON task_attachments (task_id, created_at DESC);

-- File type filtering
CREATE INDEX IF NOT EXISTS idx_task_attachments_type
ON task_attachments (file_type, created_at DESC);

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Query to check index usage
/*
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to find missing indexes (run after some production traffic)
/*
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan > 0
ORDER BY seq_tup_read DESC;
*/

-- ============================================================================
-- INDEX MAINTENANCE
-- ============================================================================

-- Add these to cron or scheduled tasks:

-- Analyze tables after index creation
-- ANALYZE tasks, task_offers, messages, payments, profiles, tasker_details;

-- Regular maintenance (weekly)
-- VACUUM ANALYZE;

-- Monitor index bloat (monthly)
-- SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

COMMENT ON SCHEMA public IS 'Production indexes applied for TehtäväMestari - monitor performance and adjust as needed';
