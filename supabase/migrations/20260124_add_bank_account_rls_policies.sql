-- ============================================================================
-- Add RLS Policies for Bank Account Info Table
-- ============================================================================
-- Created: 2026-01-21
-- Purpose: Enable taskers to manage their own bank account information

-- ============================================================================
-- BANK ACCOUNT INFO POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE bank_account_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Taskers can view own bank account info" ON bank_account_info;
DROP POLICY IF EXISTS "Taskers can insert own bank account info" ON bank_account_info;
DROP POLICY IF EXISTS "Taskers can update own bank account info" ON bank_account_info;
DROP POLICY IF EXISTS "Admins can view all bank account info" ON bank_account_info;
DROP POLICY IF EXISTS "Admins can update all bank account info" ON bank_account_info;

-- 1. Taskers can VIEW their own bank account info
CREATE POLICY "Taskers can view own bank account info" ON bank_account_info
    FOR SELECT
    USING (tasker_id = auth.uid());

-- 2. Taskers can INSERT their own bank account info
CREATE POLICY "Taskers can insert own bank account info" ON bank_account_info
    FOR INSERT
    WITH CHECK (tasker_id = auth.uid());

-- 3. Taskers can UPDATE their own bank account info
CREATE POLICY "Taskers can update own bank account info" ON bank_account_info
    FOR UPDATE
    USING (tasker_id = auth.uid())
    WITH CHECK (tasker_id = auth.uid());

-- 4. Admins can VIEW all bank account info (for processing withdrawals)
CREATE POLICY "Admins can view all bank account info" ON bank_account_info
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. Admins can UPDATE all bank account info (for verification)
CREATE POLICY "Admins can update all bank account info" ON bank_account_info
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- TASKER BALANCE POLICIES (if not exists)
-- ============================================================================

ALTER TABLE tasker_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Taskers can view own balance" ON tasker_balance;
DROP POLICY IF EXISTS "Admins can view all balances" ON tasker_balance;
DROP POLICY IF EXISTS "Admins can update balances" ON tasker_balance;

-- 1. Taskers can VIEW their own balance
CREATE POLICY "Taskers can view own balance" ON tasker_balance
    FOR SELECT
    USING (tasker_id = auth.uid());

-- 2. Admins can VIEW all balances
CREATE POLICY "Admins can view all balances" ON tasker_balance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. Admins can UPDATE balances
CREATE POLICY "Admins can update balances" ON tasker_balance
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- WITHDRAWAL REQUESTS POLICIES (if not exists)
-- ============================================================================

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Taskers can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Taskers can create withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- 1. Taskers can VIEW their own withdrawal requests
CREATE POLICY "Taskers can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT
    USING (tasker_id = auth.uid());

-- 2. Taskers can INSERT their own withdrawal requests
CREATE POLICY "Taskers can create withdrawal requests" ON withdrawal_requests
    FOR INSERT
    WITH CHECK (tasker_id = auth.uid());

-- 3. Admins can VIEW all withdrawal requests
CREATE POLICY "Admins can view all withdrawal requests" ON withdrawal_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Admins can UPDATE all withdrawal requests
CREATE POLICY "Admins can update withdrawal requests" ON withdrawal_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
