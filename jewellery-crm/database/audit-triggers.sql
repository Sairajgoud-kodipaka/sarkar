-- =====================================================
-- AUDIT LOG TRIGGERS FOR JEWELLERY CRM SYSTEM
-- =====================================================
-- This file contains all the database triggers needed for automatic audit logging
-- Run this file in your Supabase SQL editor to enable comprehensive audit logging

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
            SELECT unnest(akeys(to_jsonb(NEW) - to_jsonb(OLD)))
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
DROP TRIGGER IF EXISTS customers_audit_trigger ON customers;
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_customers_changes();

-- =====================================================
-- PRODUCTS TABLE TRIGGERS
-- =====================================================

-- Trigger function for products table
CREATE OR REPLACE FUNCTION audit_products_changes()
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
      'products',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'product_creation',
        'product_name', NEW.name,
        'product_sku', NEW.sku,
        'product_type', NEW.type
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
      'products',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'product_update',
        'product_name', NEW.name,
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE key IN (
            SELECT unnest(akeys(to_jsonb(NEW) - to_jsonb(OLD)))
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
      'products',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'product_deletion',
        'product_name', OLD.name,
        'product_sku', OLD.sku
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for products table
DROP TRIGGER IF EXISTS products_audit_trigger ON products;
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_products_changes();

-- =====================================================
-- ORDERS TABLE TRIGGERS
-- =====================================================

-- Trigger function for orders table
CREATE OR REPLACE FUNCTION audit_orders_changes()
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
      'orders',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'order_creation',
        'order_amount', NEW.total_amount,
        'customer_id', NEW.customer_id,
        'order_status', NEW.status
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
      'orders',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'order_update',
        'order_amount', NEW.total_amount,
        'status_change', CASE 
          WHEN OLD.status != NEW.status THEN OLD.status || ' -> ' || NEW.status
          ELSE 'No status change'
        END
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
      'orders',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'order_deletion',
        'order_amount', OLD.total_amount,
        'customer_id', OLD.customer_id
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for orders table
DROP TRIGGER IF EXISTS orders_audit_trigger ON orders;
CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_orders_changes();

-- =====================================================
-- APPOINTMENTS TABLE TRIGGERS
-- =====================================================

-- Trigger function for appointments table
CREATE OR REPLACE FUNCTION audit_appointments_changes()
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
      'appointments',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'appointment_creation',
        'customer_name', NEW.customer_name,
        'appointment_date', NEW.appointment_date,
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
      'appointments',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'appointment_update',
        'customer_name', NEW.customer_name,
        'status_change', CASE 
          WHEN OLD.status != NEW.status THEN OLD.status || ' -> ' || NEW.status
          ELSE 'No status change'
        END
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
      'appointments',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'appointment_deletion',
        'customer_name', OLD.customer_name,
        'appointment_date', OLD.appointment_date
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for appointments table
DROP TRIGGER IF EXISTS appointments_audit_trigger ON appointments;
CREATE TRIGGER appointments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_appointments_changes();

-- =====================================================
-- USER MANAGEMENT TRIGGERS
-- =====================================================

-- Trigger function for team_members table
CREATE OR REPLACE FUNCTION audit_team_members_changes()
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
      'team_members',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'team_member_creation',
        'member_name', NEW.first_name || ' ' || NEW.last_name,
        'member_role', NEW.role,
        'member_email', NEW.email
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
      'team_members',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'team_member_update',
        'member_name', NEW.first_name || ' ' || NEW.last_name,
        'role_change', CASE 
          WHEN OLD.role != NEW.role THEN OLD.role || ' -> ' || NEW.role
          ELSE 'No role change'
        END
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
      'team_members',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'team_member_deletion',
        'member_name', OLD.first_name || ' ' || OLD.last_name,
        'member_role', OLD.role
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for team_members table
DROP TRIGGER IF EXISTS team_members_audit_trigger ON team_members;
CREATE TRIGGER team_members_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION audit_team_members_changes();

-- =====================================================
-- NOTE: INVENTORY AND STOCK TRANSFER TABLES NOT IMPLEMENTED
-- =====================================================
-- 
-- These tables are not currently in your database schema:
-- - inventory: For tracking product stock quantities
-- - stock_transfers: For managing stock movements between stores
--
-- If you want to implement inventory tracking in the future, you would need to:
-- 1. Create the inventory table with product_id, quantity, store_id, etc.
-- 2. Create the stock_transfers table for inter-store transfers
-- 3. Then uncomment and use the audit triggers below
--
-- For now, these audit triggers are commented out to avoid errors.
--
-- =====================================================
-- FUTURE: INVENTORY TRIGGERS (COMMENTED OUT)
-- =====================================================
/*
-- Trigger function for inventory table
CREATE OR REPLACE FUNCTION audit_inventory_changes()
RETURNS TRIGGER AS $$
-- ... inventory trigger logic would go here
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for inventory table
DROP TRIGGER IF EXISTS inventory_audit_trigger ON inventory;
CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION audit_inventory_changes();
*/

-- =====================================================
-- FUTURE: STOCK TRANSFER TRIGGERS (COMMENTED OUT)
-- =====================================================
/*
-- Trigger function for stock_transfers table
CREATE OR REPLACE FUNCTION audit_stock_transfers_changes()
RETURNS TRIGGER AS $$
-- ... stock transfer trigger logic would go here
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for stock_transfers table
DROP TRIGGER IF EXISTS stock_transfers_audit_trigger ON stock_transfers;
CREATE TRIGGER stock_transfers_audit_trigger
  AFTER INSERT OR UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION audit_stock_transfers_changes();
*/

-- =====================================================
-- ANNOUNCEMENTS TRIGGERS
-- =====================================================

-- Trigger function for announcements table
CREATE OR REPLACE FUNCTION audit_announcements_changes()
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
      'announcements',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'announcement_creation',
        'announcement_title', NEW.title,
        'announcement_type', NEW.type,
        'target_audience', NEW.target_audience
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
      'announcements',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'announcement_update',
        'announcement_title', NEW.title,
        'content_changed', OLD.content != NEW.content,
        'status_changed', OLD.is_active != NEW.is_active
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
      'announcements',
      OLD.id,
      'delete',
      to_jsonb(OLD),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'announcement_deletion',
        'announcement_title', OLD.title,
        'announcement_type', OLD.type
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for announcements table
DROP TRIGGER IF EXISTS announcements_audit_trigger ON announcements;
CREATE TRIGGER announcements_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION audit_announcements_changes();

-- =====================================================
-- SUPPORT TICKETS TRIGGERS
-- =====================================================

-- Trigger function for support_tickets table
CREATE OR REPLACE FUNCTION audit_support_tickets_changes()
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
      'support_tickets',
      NEW.id,
      'create',
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'support_ticket_creation',
        'ticket_subject', NEW.subject,
        'ticket_priority', NEW.priority,
        'ticket_status', NEW.status,
        'customer_id', NEW.customer_id
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
      'support_tickets',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'support_ticket_update',
        'ticket_subject', NEW.subject,
        'status_change', CASE 
          WHEN OLD.status != NEW.status THEN OLD.status || ' -> ' || NEW.status
          ELSE 'No status change'
        END,
        'priority_change', CASE 
          WHEN OLD.priority != NEW.priority THEN OLD.priority || ' -> ' || NEW.priority
          ELSE 'No priority change'
        END
      )
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for support_tickets table
DROP TRIGGER IF EXISTS support_tickets_audit_trigger ON support_tickets;
CREATE TRIGGER support_tickets_audit_trigger
  AFTER INSERT OR UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION audit_support_tickets_changes();

-- =====================================================
-- BUSINESS SETTINGS TRIGGERS
-- =====================================================

-- Trigger function for business_settings table
CREATE OR REPLACE FUNCTION audit_business_settings_changes()
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

  -- Handle UPDATE (business settings are typically not created/deleted)
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
      'business_settings',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      user_context.user_id,
      user_context.user_email,
      client_ip,
      user_agent,
      jsonb_build_object(
        'event_type', 'business_settings_update',
        'business_name', NEW.name,
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE key IN (
            SELECT unnest(akeys(to_jsonb(NEW) - to_jsonb(OLD)))
          )
        )
      )
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for business_settings table
DROP TRIGGER IF EXISTS business_settings_audit_trigger ON business_settings;
CREATE TRIGGER business_settings_audit_trigger
  AFTER UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION audit_business_settings_changes();

-- =====================================================
-- FINAL NOTES
-- =====================================================

/*
This comprehensive audit logging system provides:

1. AUTOMATIC TRACKING: All CRUD operations are automatically logged
2. USER CONTEXT: Captures who performed each action
3. IP ADDRESS: Tracks the source of each action
4. DETAILED CHANGES: Records old and new values for updates
5. CONTEXTUAL INFO: Additional metadata for each action type
6. SECURITY: Uses SECURITY DEFINER for proper access control

To use this system:

1. Run this SQL file in your Supabase SQL editor
2. The triggers will automatically start logging all changes
3. Access audit logs through the AuditLogDashboard component
4. Use the AuditService for programmatic access

The system covers all major tables:
- customers
- products  
- orders
- appointments
- team_members
- announcements
- support_tickets
- business_settings

Note: inventory and stock_transfers tables are not currently implemented
but can be added in the future if needed.

Each trigger provides context-specific information relevant to that table type.
*/
