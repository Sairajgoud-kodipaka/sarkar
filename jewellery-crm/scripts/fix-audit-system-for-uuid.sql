-- Fix Audit System for UUID Primary Keys
-- This script updates the audit_logs table and triggers to handle UUID primary keys

-- First, let's check the current audit_logs table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update the record_id column to handle both integer and UUID primary keys
ALTER TABLE public.audit_logs 
ALTER COLUMN record_id TYPE TEXT;

-- Update the audit function to handle different data types
CREATE OR REPLACE FUNCTION audit_generic_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_context RECORD;
  client_ip TEXT;
  user_agent TEXT;
BEGIN
  -- Get user context from current_setting
  BEGIN
    user_context.user_id := current_setting('app.current_user_id', TRUE);
    user_context.user_email := current_setting('app.current_user_email', TRUE);
  EXCEPTION
    WHEN OTHERS THEN
      user_context.user_id := NULL;
      user_context.user_email := NULL;
  END;

  -- Get client IP and user agent
  client_ip := current_setting('app.client_ip', TRUE);
  user_agent := current_setting('app.user_agent', TRUE);

  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      new_values,
      user_id,
      user_email,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::TEXT, -- Convert UUID to TEXT
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      NOW()
    );
    RETURN NEW;
  
  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id,
      user_email,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::TEXT, -- Convert UUID to TEXT
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      NOW()
    );
    RETURN NEW;
  
  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      user_id,
      user_email,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::TEXT, -- Convert UUID to TEXT
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      NOW()
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers
DROP TRIGGER IF EXISTS team_members_audit_trigger ON team_members;

-- Recreate the trigger
CREATE TRIGGER team_members_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

-- Verify the fix
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
