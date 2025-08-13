-- =====================================================
-- COMPLETE AUDIT SYSTEM FIX
-- =====================================================
-- This script fixes ALL audit system issues in one go
-- Run this in your Supabase SQL Editor to resolve everything

-- =====================================================
-- STEP 1: FIX THE AUDIT_LOGS TABLE SCHEMA
-- =====================================================

-- Add missing additional_context column
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS additional_context jsonb;

-- Update the action constraint to include all actions used in triggers
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_action_check 
CHECK (action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'restore'::text, 'login'::text, 'logout'::text, 'export'::text, 'import'::text]));

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =====================================================
-- STEP 2: DROP ALL EXISTING AUDIT TRIGGERS AND FUNCTIONS
-- =====================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS customers_audit_trigger ON customers;
DROP TRIGGER IF EXISTS products_audit_trigger ON products;
DROP TRIGGER IF EXISTS orders_audit_trigger ON orders;
DROP TRIGGER IF EXISTS appointments_audit_trigger ON appointments;
DROP TRIGGER IF EXISTS team_members_audit_trigger ON team_members;
DROP TRIGGER IF EXISTS announcements_audit_trigger ON announcements;
DROP TRIGGER IF EXISTS support_tickets_audit_trigger ON support_tickets;
DROP TRIGGER IF EXISTS business_settings_audit_trigger ON business_settings;
DROP TRIGGER IF EXISTS deals_audit_trigger ON deals;
DROP TRIGGER IF EXISTS visits_audit_trigger ON visits;
DROP TRIGGER IF EXISTS categories_audit_trigger ON categories;
DROP TRIGGER IF EXISTS escalations_audit_trigger ON escalations;
DROP TRIGGER IF EXISTS stores_audit_trigger ON stores;

-- Drop existing functions
DROP FUNCTION IF EXISTS audit_customers_changes();
DROP FUNCTION IF EXISTS audit_products_changes();
DROP FUNCTION IF EXISTS audit_orders_changes();
DROP FUNCTION IF EXISTS audit_appointments_changes();
DROP FUNCTION IF EXISTS audit_team_members_changes();
DROP FUNCTION IF EXISTS audit_announcements_changes();
DROP FUNCTION IF EXISTS audit_support_tickets_changes();
DROP FUNCTION IF EXISTS audit_business_settings_changes();
DROP FUNCTION IF EXISTS audit_deals_changes();
DROP FUNCTION IF EXISTS audit_visits_changes();
DROP FUNCTION IF EXISTS audit_categories_changes();
DROP FUNCTION IF EXISTS audit_escalations_changes();
DROP FUNCTION IF EXISTS audit_stores_changes();

-- =====================================================
-- STEP 3: CREATE HELPER FUNCTIONS
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
-- STEP 4: CREATE SIMPLIFIED AUDIT FUNCTION
-- =====================================================

-- Generic audit function for all tables
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

-- =====================================================
-- STEP 5: CREATE TRIGGERS FOR ALL TABLES
-- =====================================================

-- Create triggers for all major tables
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

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

CREATE TRIGGER deals_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER visits_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON visits
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER categories_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER escalations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON escalations
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

CREATE TRIGGER stores_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON stores
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

-- Business settings only has UPDATE operations
CREATE TRIGGER business_settings_audit_trigger
  AFTER UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION audit_generic_changes();

-- =====================================================
-- STEP 6: VERIFY THE SETUP
-- =====================================================

-- Verify table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Verify triggers are created
SELECT 'Triggers Created:' as info;
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
ORDER BY trigger_name;

-- Test with a simple customer update (if customers table exists and has data)
DO $$
BEGIN
  -- Check if customers table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    IF EXISTS (SELECT 1 FROM customers LIMIT 1) THEN
      -- Update a customer to test the trigger
      UPDATE customers SET notes = COALESCE(notes, '') || ' - Audit test ' || now()::text WHERE id = (SELECT id FROM customers LIMIT 1);
      
      -- Check if audit log was created
      IF EXISTS (SELECT 1 FROM audit_logs WHERE table_name = 'customers' AND action = 'update' ORDER BY created_at DESC LIMIT 1) THEN
        RAISE NOTICE '✅ Audit system is working! Customer update was logged.';
      ELSE
        RAISE NOTICE '❌ Audit system test failed. No audit log created.';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ Customers table exists but has no data. Cannot test audit system.';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Customers table does not exist. Cannot test audit system.';
  END IF;
END $$;

-- Show recent audit logs
SELECT 'Recent Audit Logs:' as info;
SELECT 
  table_name,
  action,
  record_id,
  user_email,
  created_at
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 5;
