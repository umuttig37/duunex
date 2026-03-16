-- ============================================================================
-- Add RLS Policies for Payments Table
-- ============================================================================
-- Created: 2026-03-16
-- Purpose: Allow task owners to create payment records for their tasks and
--          view their own payments, while keeping data isolated per user.

-- Enable RLS on payments if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can create payments for their tasks" ON payments;
DROP POLICY IF EXISTS "Users can view their payments" ON payments;

-- 1. Users can INSERT payments for tasks they own
CREATE POLICY "Users can create payments for their tasks" ON payments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND task_id IN (
            SELECT id
            FROM tasks
            WHERE user_id = auth.uid()
        )
    );

-- 2. Users can VIEW their own payments
CREATE POLICY "Users can view their payments" ON payments
    FOR SELECT
    USING (
        auth.uid() = user_id
    );

