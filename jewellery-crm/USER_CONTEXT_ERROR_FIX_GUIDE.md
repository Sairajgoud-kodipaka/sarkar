# 🔧 Fix for "record 'user_context' is not assigned yet" Error

## 🚨 **Error Description**
```
Error creating customer: Error: record "user_context" is not assigned yet
```

This error occurs when the database audit triggers cannot access the user context information needed for logging changes.

## 🔍 **Root Cause**
The database audit triggers are trying to access user authentication information using `auth.uid()` and `auth.jwt()` functions, but these functions are not returning the expected values due to:

1. **Authentication context not properly set** in the database session
2. **Audit triggers failing** when user context is missing
3. **Database session configuration** issues

## 🛠️ **Solutions (Choose One)**

### **Option 1: Fix Database Audit Triggers (Recommended)**

Run the SQL script to fix the audit triggers permanently:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f database/fix-user-context-error.sql
```

Or run it in the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/fix-user-context-error.sql`
4. Execute the script

### **Option 2: Temporarily Disable Audit Triggers (Quick Fix)**

For immediate testing, disable the audit triggers:

```bash
# Run in Supabase SQL Editor:
psql -h your-db-host -U postgres -d postgres -f database/temporarily-disable-audit.sql
```

**⚠️ Warning**: This disables audit logging temporarily. Re-enable when the main issue is fixed.

### **Option 3: Manual Database Fix**

Connect to your database and run these commands manually:

```sql
-- Drop and recreate the problematic trigger
DROP TRIGGER IF EXISTS audit_customers_changes ON customers;
DROP FUNCTION IF EXISTS audit_customers_changes();

-- Create a simple audit function without user context
CREATE OR REPLACE FUNCTION audit_customers_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple logging without user context for now
  INSERT INTO audit_logs (
    table_name, record_id, action, new_values, user_id, user_email
  ) VALUES (
    'customers', NEW.id, 'create', to_jsonb(NEW), 
    gen_random_uuid(), 'system@example.com'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER audit_customers_changes
  AFTER INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_customers_changes();
```

## 🔧 **Verification Steps**

After applying any fix:

1. **Test customer creation** in your application
2. **Check browser console** for errors
3. **Verify audit logs** are being created (if using Option 1)
4. **Check database logs** for any remaining errors

## 🚀 **Prevention**

To prevent this issue in the future:

1. **Ensure proper authentication** before database operations
2. **Test audit triggers** after database schema changes
3. **Monitor database logs** for authentication issues
4. **Use robust error handling** in audit functions

## 📞 **Support**

If the issue persists:

1. **Check Supabase logs** in your dashboard
2. **Verify RLS policies** are correctly configured
3. **Ensure user authentication** is working properly
4. **Contact database administrator** if needed

## 🔄 **Rollback**

If you need to rollback changes:

```sql
-- Re-enable audit triggers
ALTER TABLE customers ENABLE TRIGGER audit_customers_changes;
ALTER TABLE products ENABLE TRIGGER audit_products_changes;
-- ... repeat for other tables
```

## 📋 **Files Modified**

- `database/fix-user-context-error.sql` - Permanent fix for audit triggers
- `database/temporarily-disable-audit.sql` - Temporary disable script
- `src/lib/api-service.ts` - Enhanced error handling
- `src/components/customers/AddCustomerModal.tsx` - Better auth checks

---

**Note**: This is a database-level issue that requires database administrator access to resolve. The application-level fixes help with error handling but don't resolve the root cause.
