-- AUDIT SYSTEM TROUBLESHOOTING SCRIPT
-- Run this if you still have issues after FINAL_AUDIT_FIX.sql

-- Check current audit system status
SELECT '=== AUDIT SYSTEM STATUS ===' as info;

-- 1. Check if audit_logs table exists and has correct structure
SELECT '1. AUDIT_LOGS TABLE STRUCTURE:' as check_item;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN '✅ audit_logs table exists'
    ELSE '❌ audit_logs table missing'
  END as status;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- 2. Check if additional_context column exists
SELECT '2. ADDITIONAL_CONTEXT COLUMN:' as check_item;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'additional_context') 
    THEN '✅ additional_context column exists'
    ELSE '❌ additional_context column missing'
  END as status;

-- 3. Check current triggers
SELECT '3. CURRENT AUDIT TRIGGERS:' as check_item;
SELECT 
  trigger_name, 
  event_object_table, 
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY trigger_name;

-- 4. Check if functions exist
SELECT '4. AUDIT FUNCTIONS:' as check_item;
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

-- 5. Check permissions
SELECT '5. PERMISSIONS:' as check_item;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'audit_logs';

-- 6. Test audit log insert
SELECT '6. TEST AUDIT LOG INSERT:' as check_item;
DO $$
BEGIN
  BEGIN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_values, 
      user_id, user_email, ip_address, user_agent, additional_context
    ) VALUES (
      'test', 1, 'create', '{"test": "value"}', 
      gen_random_uuid(), 'test@test.com', '127.0.0.1', 'test', '{"event": "test"}'
    );
    RAISE NOTICE '✅ Test audit log insert successful';
    
    -- Clean up test data
    DELETE FROM audit_logs WHERE table_name = 'test';
    RAISE NOTICE '✅ Test data cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test audit log insert failed: %', SQLERRM;
  END;
END $$;

-- 7. Check for any remaining old triggers
SELECT '7. CHECKING FOR OLD TRIGGERS:' as check_item;
SELECT 
  trigger_name,
  event_object_table,
  '❌ OLD TRIGGER - NEEDS REMOVAL' as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%' 
  AND trigger_name NOT LIKE '%_audit_trigger'
ORDER BY trigger_name;

-- 8. Final status summary
SELECT '=== FINAL STATUS ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'additional_context')
    AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'audit_generic_changes')
    THEN '✅ AUDIT SYSTEM IS FULLY OPERATIONAL'
    ELSE '❌ AUDIT SYSTEM HAS ISSUES - RUN FINAL_AUDIT_FIX.sql AGAIN'
  END as overall_status;
