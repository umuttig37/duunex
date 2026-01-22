-- ============================================================================
-- Add RLS Policies for Task Related Tables
-- ============================================================================
-- Created: 2026-01-20
-- Purpose: Enable proper access to task attachments and specific answers

-- ============================================================================
-- TASK ATTACHMENTS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create attachments for their tasks" ON task_attachments;
DROP POLICY IF EXISTS "Users can view attachments for their tasks" ON task_attachments;
DROP POLICY IF EXISTS "Taskers can view attachments for assigned tasks" ON task_attachments;
DROP POLICY IF EXISTS "Anyone can view attachments for open tasks" ON task_attachments;

-- 1. Users can INSERT attachments for their own tasks
CREATE POLICY "Users can create attachments for their tasks" ON task_attachments
    FOR INSERT
    WITH CHECK (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- 2. Users can VIEW attachments for their own tasks
CREATE POLICY "Users can view attachments for their tasks" ON task_attachments
    FOR SELECT
    USING (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- 3. Taskers can VIEW attachments for tasks assigned to them
CREATE POLICY "Taskers can view attachments for assigned tasks" ON task_attachments
    FOR SELECT
    USING (
        task_id IN (SELECT id FROM tasks WHERE assigned_tasker_id = auth.uid())
    );

-- 4. Anyone can VIEW attachments for open tasks
CREATE POLICY "Anyone can view attachments for open tasks" ON task_attachments
    FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE status IN ('open', 'assigned', 'paid', 'in_progress') 
            AND posting_type = 'open'
        )
    );

-- ============================================================================
-- TASK SPECIFIC ANSWERS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE task_specific_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create answers for their tasks" ON task_specific_answers;
DROP POLICY IF EXISTS "Users can view answers for their tasks" ON task_specific_answers;
DROP POLICY IF EXISTS "Taskers can view answers for assigned tasks" ON task_specific_answers;
DROP POLICY IF EXISTS "Taskers can view answers for open tasks" ON task_specific_answers;

-- 1. Users can INSERT answers for their own tasks
CREATE POLICY "Users can create answers for their tasks" ON task_specific_answers
    FOR INSERT
    WITH CHECK (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- 2. Users can VIEW answers for their own tasks
CREATE POLICY "Users can view answers for their tasks" ON task_specific_answers
    FOR SELECT
    USING (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- 3. Taskers can VIEW answers for tasks assigned to them
CREATE POLICY "Taskers can view answers for assigned tasks" ON task_specific_answers
    FOR SELECT
    USING (
        task_id IN (SELECT id FROM tasks WHERE assigned_tasker_id = auth.uid())
    );

-- 4. Taskers can VIEW answers for open tasks (to make informed offers)
CREATE POLICY "Taskers can view answers for open tasks" ON task_specific_answers
    FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE status IN ('open', 'assigned', 'paid', 'in_progress') 
            AND posting_type = 'open'
        )
    );
