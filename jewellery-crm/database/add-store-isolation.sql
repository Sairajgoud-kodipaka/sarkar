-- Store Isolation Implementation
-- This script adds store_id fields to relevant tables to implement store-based data isolation

-- 1. Add store_id to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 2. Add store_id to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 3. Add store_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 4. Add store_id to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 5. Add store_id to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 6. Add store_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 7. Add store_id to support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 8. Add store_id to escalations table
ALTER TABLE public.escalations 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 9. Add store_id to visits table
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 10. Add store_id to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 11. Add store_id to kb_articles table
ALTER TABLE public.kb_articles 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- 12. Add store_id to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS store_id integer REFERENCES public.stores(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_store_id ON public.team_members(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_deals_store_id ON public.deals(store_id);
CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON public.appointments(store_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_store_id ON public.support_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_escalations_store_id ON public.escalations(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_store_id ON public.visits(store_id);
CREATE INDEX IF NOT EXISTS idx_announcements_store_id ON public.announcements(store_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_store_id ON public.kb_articles(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON public.notifications(store_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_team_members_role_store ON public.team_members(role, store_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_store ON public.customers(assigned_to, store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_store ON public.products(category_id, store_id);
CREATE INDEX IF NOT EXISTS idx_sales_date_store ON public.sales(date, store_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_store ON public.deals(stage, store_id);

-- Add RLS (Row Level Security) policies for store isolation
-- Enable RLS on all tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for store isolation
-- Team Members Policy
CREATE POLICY "team_members_store_isolation" ON public.team_members
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Customers Policy
CREATE POLICY "customers_store_isolation" ON public.customers
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Products Policy
CREATE POLICY "products_store_isolation" ON public.products
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Sales Policy
CREATE POLICY "sales_store_isolation" ON public.sales
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Deals Policy
CREATE POLICY "deals_store_isolation" ON public.deals
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Appointments Policy
CREATE POLICY "appointments_store_isolation" ON public.appointments
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Support Tickets Policy
CREATE POLICY "support_tickets_store_isolation" ON public.support_tickets
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Escalations Policy
CREATE POLICY "escalations_store_isolation" ON public.escalations
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Visits Policy
CREATE POLICY "visits_store_isolation" ON public.visits
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Announcements Policy
CREATE POLICY "announcements_store_isolation" ON public.announcements
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- KB Articles Policy
CREATE POLICY "kb_articles_store_isolation" ON public.kb_articles
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Notifications Policy
CREATE POLICY "notifications_store_isolation" ON public.notifications
    FOR ALL USING (
        store_id = current_setting('app.current_store_id', true)::integer
        OR 
        current_setting('app.user_role', true) IN ('platform_admin', 'business_admin')
    );

-- Create function to set current store context
CREATE OR REPLACE FUNCTION set_store_context(store_id integer, user_role text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_store_id', store_id::text, false);
    PERFORM set_config('app.user_role', user_role, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to get current store context
CREATE OR REPLACE FUNCTION get_current_store_id()
RETURNS integer AS $$
BEGIN
    RETURN current_setting('app.current_store_id', true)::integer;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.user_role', true);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_store_context(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- Update existing data to assign store_id based on floor (temporary mapping)
-- This assumes floor 1 = store 1, floor 2 = store 2, etc.
-- You should update this based on your actual store configuration

UPDATE public.team_members 
SET store_id = 1 
WHERE floor = 1 AND store_id IS NULL;

UPDATE public.team_members 
SET store_id = 2 
WHERE floor = 2 AND store_id IS NULL;

UPDATE public.team_members 
SET store_id = 3 
WHERE floor = 3 AND store_id IS NULL;

UPDATE public.customers 
SET store_id = 1 
WHERE floor = 1 AND store_id IS NULL;

UPDATE public.customers 
SET store_id = 2 
WHERE floor = 2 AND store_id IS NULL;

UPDATE public.customers 
SET store_id = 3 
WHERE floor = 3 AND store_id IS NULL;

UPDATE public.products 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.sales 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.deals 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.appointments 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.support_tickets 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.escalations 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.visits 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.announcements 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.kb_articles 
SET store_id = 1 
WHERE store_id IS NULL;

UPDATE public.notifications 
SET store_id = 1 
WHERE store_id IS NULL;

-- Make store_id NOT NULL after populating data
ALTER TABLE public.team_members ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.deals ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.escalations ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.visits ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.kb_articles ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN store_id SET NOT NULL;

COMMENT ON TABLE public.team_members IS 'Team members with store isolation';
COMMENT ON TABLE public.customers IS 'Customers with store isolation';
COMMENT ON TABLE public.products IS 'Products with store isolation';
COMMENT ON TABLE public.sales IS 'Sales with store isolation';
COMMENT ON TABLE public.deals IS 'Deals with store isolation';
COMMENT ON TABLE public.appointments IS 'Appointments with store isolation';
COMMENT ON TABLE public.support_tickets IS 'Support tickets with store isolation';
COMMENT ON TABLE public.escalations IS 'Escalations with store isolation';
COMMENT ON TABLE public.visits IS 'Visits with store isolation';
COMMENT ON TABLE public.announcements IS 'Announcements with store isolation';
COMMENT ON TABLE public.kb_articles IS 'KB articles with store isolation';
COMMENT ON TABLE public.notifications IS 'Notifications with store isolation';
