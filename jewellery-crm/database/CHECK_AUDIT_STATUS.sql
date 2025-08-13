-- CHECK AUDIT SYSTEM STATUS
-- Run this to diagnose why audit logs aren't showing up

-- 1. Check if audit_logs table exists and has data
SELECT '=== AUDIT LOGS TABLE STATUS ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN '✅ audit_logs table exists'
    ELSE '❌ audit_logs table missing'
  END as table_status;

-- Check table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Check if table has data
SELECT 'Data Count:' as info;
SELECT COUNT(*) as total_records FROM audit_logs;

-- 2. Check recent audit logs (last 10)
SELECT '=== RECENT AUDIT LOGS ===' as info;
SELECT 
  id,
  table_name,
  record_id,
  action,
  user_email,
  created_at,
  additional_context
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if triggers are active
SELECT '=== TRIGGER STATUS ===' as info;
SELECT 
  trigger_name, 
  event_object_table, 
  event_manipulation,
  action_statement,
  CASE 
    WHEN tgrelid IS NOT NULL THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY trigger_name;

-- 4. Check if functions exist
SELECT '=== FUNCTION STATUS ===' as info;
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'audit_generic_changes' THEN '✅ Main audit function'
    WHEN routine_name = 'get_current_user_context' THEN '✅ User context function'
    WHEN routine_name = 'get_client_ip' THEN '✅ IP function'
    WHEN routine_name = 'get_user_agent' THEN '✅ User agent function'
    ELSE '❌ Unexpected function'
  END as status
FROM information_schema.routines 
WHERE routine_name LIKE '%audit%' OR routine_name LIKE '%user%' OR routine_name LIKE '%client%'
ORDER BY routine_name;

-- 5. Check RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- 6. Check permissions
SELECT '=== PERMISSIONS ===' as info;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'audit_logs';

-- 7. Test audit log insert manually
SELECT '=== TESTING AUDIT LOG INSERT ===' as info;
DO $$
BEGIN
  BEGIN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_values, 
      user_id, user_email, ip_address, user_agent, additional_context
    ) VALUES (
      'test', 999, 'create', '{"test": "manual_insert_test"}', 
      gen_random_uuid(), 'test@test.com', '127.0.0.1', 'manual_test', '{"event": "manual_test"}'
    );
    RAISE NOTICE '✅ Manual audit log insert successful';
    
    -- Clean up test data
    DELETE FROM audit_logs WHERE table_name = 'test';
    RAISE NOTICE '✅ Test data cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Manual audit log insert failed: %', SQLERRM;
  END;
END $$;

-- 8. Check for any customers created recently
SELECT '=== RECENT CUSTOMERS ===' as info;
SELECT 
  id,
  name,
  created_at,
  updated_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Check if there are any errors in the database logs
SELECT '=== DATABASE STATUS ===' as info;
SELECT 
  current_database() as database_name,
  current_user as current_user,
  session_user as session_user;

-- 10. Final diagnostic summary
SELECT '=== DIAGNOSTIC SUMMARY ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
    AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'audit_generic_changes')
    AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name LIKE '%audit%')
    THEN '✅ AUDIT SYSTEM APPEARS TO BE WORKING'
    ELSE '❌ AUDIT SYSTEM HAS ISSUES'
  END as overall_status;
