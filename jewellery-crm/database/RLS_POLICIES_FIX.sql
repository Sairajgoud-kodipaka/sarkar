-- =====================================================
-- FIX RLS POLICIES FOR AUDIT SYSTEM
-- =====================================================
-- This script ensures RLS policies allow audit log inserts
-- Run this after the main audit fix if you still have issues

-- =====================================================
-- STEP 1: CHECK CURRENT RLS STATUS
-- =====================================================

-- Check if RLS is enabled on audit_logs table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'audit_logs';

-- =====================================================
-- STEP 2: DISABLE RLS ON AUDIT_LOGS TABLE
-- =====================================================

-- Audit logs should not have RLS restrictions as they need to be accessible
-- by the system for compliance and monitoring purposes
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: CREATE PERMISSIVE POLICIES (if RLS must be enabled)
-- =====================================================

-- If you must keep RLS enabled, create permissive policies
-- Uncomment these lines if you need RLS enabled:

/*
-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read audit logs
CREATE POLICY "Allow authenticated users to read audit logs" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow system to insert audit logs
CREATE POLICY "Allow system to insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Policy to allow system to update audit logs
CREATE POLICY "Allow system to update audit logs" ON public.audit_logs
  FOR UPDATE USING (true);

-- Policy to allow system to delete audit logs (if needed)
CREATE POLICY "Allow system to delete audit logs" ON public.audit_logs
  FOR DELETE USING (true);
*/

-- =====================================================
-- STEP 4: VERIFY PERMISSIONS
-- =====================================================

-- Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'audit_logs';

-- Check if the authenticated role has necessary permissions
SELECT 
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin
FROM pg_roles 
WHERE rolname = 'authenticated';

-- =====================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users for audit_logs
GRANT ALL ON public.audit_logs TO authenticated;

-- Grant usage on the sequence if it exists
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 6: TEST AUDIT LOG INSERT
-- =====================================================

-- Test if we can insert into audit_logs
DO $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    new_values,
    user_id,
    user_email,
    ip_address,
    user_agent,
    additional_context
  ) VALUES (
    'test_table',
    999,
    'create',
    '{"test": "value"}'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test@example.com',
    '127.0.0.1',
    'test-agent',
    '{"event_type": "test"}'::jsonb
  );
  
  RAISE NOTICE '✅ Test audit log insert successful!';
  
  -- Clean up test data
  DELETE FROM public.audit_logs WHERE table_name = 'test_table' AND record_id = 999;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Test audit log insert failed: %', SQLERRM;
END $$;
