-- ============================================================================
-- Add RLS Policies for Task Offers Table
-- ============================================================================
-- Created: 2026-03-16
-- Purpose: Allow verified taskers to create offers on open tasks and enable
--          proper visibility for taskers and task owners.

-- Enable RLS on task_offers if not already enabled
ALTER TABLE task_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Taskers can create offers on open tasks" ON task_offers;
DROP POLICY IF EXISTS "Taskers can view own offers" ON task_offers;
DROP POLICY IF EXISTS "Users can view offers to their tasks" ON task_offers;

-- 1. Taskers can INSERT offers on open, openly posted tasks
CREATE POLICY "Taskers can create offers on open tasks" ON task_offers
    FOR INSERT
    WITH CHECK (
        -- The authenticated user is the tasker making the offer
        auth.uid() = tasker_id
        AND
        -- The task is open and openly posted
        task_id IN (
            SELECT id
            FROM tasks
            WHERE status = 'open'
              AND posting_type = 'open'
        )
    );

-- 2. Taskers can VIEW their own offers
CREATE POLICY "Taskers can view own offers" ON task_offers
    FOR SELECT
    USING (
        auth.uid() = tasker_id
    );

-- 3. Task owners can VIEW offers to their tasks
CREATE POLICY "Users can view offers to their tasks" ON task_offers
    FOR SELECT
    USING (
        task_id IN (
            SELECT id
            FROM tasks
            WHERE user_id = auth.uid()
        )
    );

