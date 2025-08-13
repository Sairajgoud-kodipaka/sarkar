-- FIX AUDIT ACCESS ISSUES
-- Run this if audit logs exist but aren't visible in the UI

-- 1. Disable RLS on audit_logs table (if it exists)
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions to authenticated users
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO anon;
GRANT ALL ON public.audit_logs TO service_role;

-- 3. Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 4. Grant sequence permissions (if using serial IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Test if we can now see audit logs
SELECT '=== TESTING ACCESS ===' as info;
SELECT COUNT(*) as visible_audit_logs FROM public.audit_logs;

-- 6. Check if we can insert a test record
DO $$
BEGIN
  BEGIN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, new_values, 
      user_id, user_email, ip_address, user_agent, additional_context
    ) VALUES (
      'test_access', 888, 'create', '{"test": "access_test"}', 
      gen_random_uuid(), 'access_test@test.com', '127.0.0.1', 'access_test', '{"event": "access_test"}'
    );
    RAISE NOTICE '✅ Access test successful - can insert into audit_logs';
    
    -- Clean up
    DELETE FROM public.audit_logs WHERE table_name = 'test_access';
    RAISE NOTICE '✅ Test data cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Access test failed: %', SQLERRM;
  END;
END $$;

-- 7. Verify permissions
SELECT '=== FINAL PERMISSION CHECK ===' as info;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'audit_logs'
ORDER BY grantee, privilege_type;
