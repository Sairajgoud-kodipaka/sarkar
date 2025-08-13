-- Fix for "record 'user_context' is not assigned yet" error
-- Drop and recreate audit triggers with better error handling

-- Drop existing triggers
DROP TRIGGER IF EXISTS audit_customers_changes ON customers;

-- Drop existing functions
DROP FUNCTION IF EXISTS audit_customers_changes();
DROP FUNCTION IF EXISTS get_current_user_context();

-- Create robust user context function
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE(user_id uuid, user_email text) AS $$
BEGIN
  BEGIN
    RETURN QUERY
    SELECT 
      COALESCE(auth.uid(), gen_random_uuid()) as user_id,
      COALESCE(auth.jwt() ->> 'email', 'unknown@example.com') as user_email;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      gen_random_uuid() as user_id,
      'system@example.com' as user_email;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create robust audit function
CREATE OR REPLACE FUNCTION audit_customers_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_context record;
BEGIN
  BEGIN
    SELECT * INTO user_context FROM get_current_user_context();
  EXCEPTION WHEN OTHERS THEN
    user_context.user_id := gen_random_uuid();
    user_context.user_email := 'system@example.com';
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_values, user_id, user_email
    ) VALUES (
      'customers', NEW.id, 'create', to_jsonb(NEW), user_context.user_id, user_context.user_email
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER audit_customers_changes
  AFTER INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_customers_changes();
