-- ============================================================================
-- Add RLS Policies for Tasks Table
-- ============================================================================
-- Created: 2026-01-20
-- Purpose: Enable users to create and manage their tasks with proper RLS

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Taskers can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- 1. Users can INSERT their own tasks
CREATE POLICY "Users can create their own tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Users can VIEW their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Taskers can VIEW open tasks (for browsing and making offers)
CREATE POLICY "Taskers can view open tasks" ON tasks
    FOR SELECT
    USING (
        status IN ('open', 'assigned', 'paid', 'in_progress', 'completed', 'early_completed') 
        AND posting_type = 'open'
    );

-- 4. Assigned taskers can VIEW tasks assigned to them
CREATE POLICY "Assigned taskers can view their tasks" ON tasks
    FOR SELECT
    USING (auth.uid() = assigned_tasker_id);

-- 5. Users can UPDATE their own tasks
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (auth.uid() = user_id);

-- 6. Users can DELETE their own tasks
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);
