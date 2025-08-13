-- =====================================================
-- FIX AUDIT TRIGGERS
-- =====================================================
-- This script fixes the audit triggers to work with the current schema
-- Run this after fixing the audit_logs table schema

-- Drop existing triggers first
DROP TRIGGER IF EXISTS customers_audit_trigger ON customers;
DROP TRIGGER IF EXISTS products_audit_trigger ON products;
DROP TRIGGER IF EXISTS orders_audit_trigger ON orders;
DROP TRIGGER IF EXISTS appointments_audit_trigger ON appointments;
DROP TRIGGER IF EXISTS team_members_audit_trigger ON team_members;
DROP TRIGGER IF EXISTS announcements_audit_trigger ON announcements;
DROP TRIGGER IF EXISTS support_tickets_audit_trigger ON support_tickets;
DROP TRIGGER IF EXISTS business_settings_audit_trigger ON business_settings;

-- Drop existing functions
DROP FUNCTION IF EXISTS audit_customers_changes();
DROP FUNCTION IF EXISTS audit_products_changes();
DROP FUNCTION IF EXISTS audit_orders_changes();
DROP FUNCTION IF EXISTS audit_appointments_changes();
DROP FUNCTION IF EXISTS audit_team_members_changes();
DROP FUNCTION IF EXISTS audit_announcements_changes();
DROP FUNCTION IF EXISTS audit_support_tickets_changes();
DROP FUNCTION IF EXISTS audit_business_settings_changes();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE(user_id uuid, user_email text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'email' as user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client IP address
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json ->> 'x-forwarded-for',
    current_setting('request.headers', true)::json ->> 'x-real-ip',
    inet_client_addr()::text,
    'unknown'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user agent
CREATE OR REPLACE FUNCTION get_user_agent()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json ->> 'user-agent',
    'unknown'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CUSTOMERS TABLE TRIGGERS
-- =====================================================

-- Trigger function for customers table
CREATE OR REPLACE FUNCTION audit_customers_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_context record;
  client_ip text;
  user_agent text;
BEGIN
  -- Get user context
  SELECT * INTO user_context FROM get_current_user_context();
  client_ip := get_client_ip();
  user_agent := get_user_agent();

  -- Handle INSERT (create)
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
      additional_context
    ) VALUES (
      'customers',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'customer_creation',
        'customer_name', NEW.name,
        'customer_phone', NEW.phone,
        'floor', NEW.floor
      )
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
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
      additional_context
    ) VALUES (
      'customers',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'customer_update',
        'customer_name', NEW.name,
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE key IN (
            SELECT unnest(array(SELECT jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD))))
          )
        )
      )
    );
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      user_id,
      user_email,
      ip_address,
      user_agent,
      additional_context
    ) VALUES (
      'customers',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'customer_deletion',
        'customer_name', OLD.name,
        'deletion_reason', 'soft_delete'
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for customers table
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_customers_changes();

-- =====================================================
-- SIMPLIFIED TRIGGERS FOR OTHER TABLES
-- =====================================================

-- Generic audit function for other tables
CREATE OR REPLACE FUNCTION audit_generic_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_context record;
  client_ip text;
  user_agent text;
BEGIN
  -- Get user context
  SELECT * INTO user_context FROM get_current_user_context();
  client_ip := get_client_ip();
  user_agent := get_user_agent();

  -- Handle INSERT (create)
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
      additional_context
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', TG_TABLE_NAME || '_creation',
        'table_name', TG_TABLE_NAME
      )
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
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
      additional_context
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', TG_TABLE_NAME || '_update',
        'table_name', TG_TABLE_NAME
      )
    );
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      user_id,
      user_email,
      ip_address,
      user_agent,
      additional_context
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', TG_TABLE_NAME || '_deletion',
        'table_name', TG_TABLE_NAME
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for other tables using the generic function
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER appointments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER team_members_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER announcements_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER support_tickets_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

-- Business settings only has UPDATE operations
CREATE TRIGGER business_settings_audit_trigger
  AFTER UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

-- Verify triggers are created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY trigger_name;
