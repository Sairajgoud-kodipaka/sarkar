# 🔧 Audit System Troubleshooting Guide

## 🚨 **Current Error**
```
Error: column "additional_context" of relation "audit_logs" does not exist
```

This error occurs when:
1. **Database schema is outdated** - Missing the `additional_context` column
2. **Old triggers are still active** - Trying to insert into non-existent columns
3. **RLS policies are blocking** - Preventing audit log inserts
4. **Permissions are insufficient** - User can't insert into audit_logs table

## ✅ **Complete Solution**

### **Step 1: Run the Main Fix (IMPORTANT!)**
Go to your **Supabase SQL Editor** and run the complete fix:

```sql
-- Copy and paste the entire content of: database/COMPLETE_AUDIT_FIX.sql
```

This script will:
- ✅ Add the missing `additional_context` column
- ✅ Fix all action constraints
- ✅ Drop old broken triggers
- ✅ Create new working triggers
- ✅ Add performance indexes
- ✅ Test the system automatically

### **Step 2: If Still Having Issues - Fix RLS Policies**
If you still get errors after Step 1, run:

```sql
-- Copy and paste the entire content of: database/RLS_POLICIES_FIX.sql
```

This will:
- ✅ Disable RLS on audit_logs table
- ✅ Grant necessary permissions
- ✅ Test audit log inserts

### **Step 3: Manual Verification**
Check if everything is working:

```sql
-- Verify the additional_context column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND column_name = 'additional_context';

-- Verify triggers are created
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';

-- Test a simple insert
INSERT INTO audit_logs (
  table_name, record_id, action, new_values, 
  user_id, user_email, ip_address, user_agent, additional_context
) VALUES (
  'test', 1, 'create', '{"test": "value"}', 
  '00000000-0000-0000-0000-000000000000', 'test@test.com', 
  '127.0.0.1', 'test', '{"event": "test"}'
);
```

## 🔍 **What Each Script Does**

### **`COMPLETE_AUDIT_FIX.sql`**
- **Schema Fix**: Adds missing `additional_context` column
- **Constraint Fix**: Updates action constraints to allow all actions
- **Trigger Cleanup**: Removes all old broken triggers
- **New Triggers**: Creates simplified, working triggers for all tables
- **Auto-Test**: Tests the system and shows results

### **`RLS_POLICIES_FIX.sql`**
- **RLS Disable**: Removes row-level security from audit_logs
- **Permission Grant**: Gives authenticated users full access
- **Test Insert**: Verifies audit log inserts work

## 🚀 **Expected Results After Fix**

1. **✅ No more "column does not exist" errors**
2. **✅ Customer creation/updates work normally**
3. **✅ All CRUD operations are automatically logged**
4. **✅ Audit dashboard shows real data**
5. **✅ Export functionality works**

## 🧪 **Testing the Fix**

### **Test 1: Create a Customer**
1. Go to your CRM
2. Try to create a new customer
3. Should work without errors
4. Check audit logs table for new entry

### **Test 2: Update a Customer**
1. Edit an existing customer
2. Save the changes
3. Should work without errors
4. Check audit logs for update entry

### **Test 3: Check Audit Dashboard**
1. Go to `/business-admin/audit-logs`
2. Should load without errors
3. Should show recent audit entries
4. Filters should work properly

## 🆘 **If Issues Persist**

### **Check 1: Database Connection**
```sql
-- Verify you're connected to the right database
SELECT current_database(), current_user;
```

### **Check 2: Table Existence**
```sql
-- Verify audit_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
);
```

### **Check 3: Column Existence**
```sql
-- Verify additional_context column exists
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'audit_logs' 
  AND column_name = 'additional_context'
);
```

### **Check 4: Trigger Status**
```sql
-- Verify triggers are active
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';
```

## 📝 **Common Issues & Solutions**

### **Issue 1: "Permission denied"**
**Solution**: Run the RLS policies fix script

### **Issue 2: "Function does not exist"**
**Solution**: Run the complete fix script again

### **Issue 3: "Constraint violation"**
**Solution**: Check if action constraints are updated

### **Issue 4: "Table does not exist"**
**Solution**: Verify you're in the correct database/schema

## 🔧 **Manual Column Addition (if scripts fail)**

If the scripts don't work, manually add the column:

```sql
-- Add the missing column
ALTER TABLE public.audit_logs 
ADD COLUMN additional_context jsonb;

-- Update constraints
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_action_check 
CHECK (action = ANY (ARRAY['create', 'update', 'delete', 'restore', 'login', 'logout', 'export', 'import']));
```

## 📊 **Success Indicators**

After the fix, you should see:
- ✅ **No console errors** in browser
- ✅ **Customer operations work** normally
- ✅ **Audit logs table** has the `additional_context` column
- ✅ **Triggers are active** and working
- ✅ **Audit dashboard** loads with data

## 🎯 **Final Steps**

1. **Run the complete fix script**
2. **Test customer creation**
3. **Test customer update**
4. **Check audit dashboard**
5. **Verify export functionality**

If everything works, your audit system is fully operational! 🎉

## 🆘 **Still Having Issues?**

1. **Check Supabase logs** for detailed error messages
2. **Verify database permissions** for your user role
3. **Ensure you're running scripts** in the correct database
4. **Check if any other triggers** are conflicting

The audit system should work perfectly after running these fixes! 🚀
