-- Sales System Database Schema
-- This replaces the old orders system with a comprehensive sales pipeline

-- Drop old orders tables if they exist
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create leads table for tracking customer interest
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    product_interest TEXT NOT NULL,
    budget_range VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'potential' CHECK (stage IN ('potential', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    floor INTEGER NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    store_id INTEGER REFERENCES public.stores(id),
    created_by UUID REFERENCES auth.users(id)
);

-- Create sales_reports table for weekly reports from floor managers
CREATE TABLE IF NOT EXISTS public.sales_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    floor_manager_id UUID REFERENCES auth.users(id) NOT NULL,
    floor INTEGER NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_leads INTEGER NOT NULL DEFAULT 0,
    converted_leads INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    notes TEXT,
    store_id INTEGER REFERENCES public.stores(id)
);

-- Create pipeline_stages table for configurable stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT 'bg-blue-100',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    store_id INTEGER REFERENCES public.stores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table for completed sales
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id),
    customer_name VARCHAR(255) NOT NULL,
    product_sold TEXT NOT NULL,
    sale_amount DECIMAL(12,2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    salesperson_id UUID REFERENCES auth.users(id),
    floor INTEGER NOT NULL,
    store_id INTEGER REFERENCES public.stores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_floor ON public.leads(floor);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_store_id ON public.leads(store_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_reports_floor ON public.sales_reports(floor);
CREATE INDEX IF NOT EXISTS idx_sales_reports_status ON public.sales_reports(status);
CREATE INDEX IF NOT EXISTS idx_sales_reports_week ON public.sales_reports(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_sales_reports_store_id ON public.sales_reports(store_id);

CREATE INDEX IF NOT EXISTS idx_sales_floor ON public.sales(floor);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages(order_index);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_store_id ON public.pipeline_stages(store_id);

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages (name, description, color, order_index) VALUES
('Potential', 'New leads with customer interest', 'bg-blue-100', 1),
('Demo', 'Product demonstration scheduled/completed', 'bg-yellow-100', 2),
('Proposal', 'Proposal sent to customer', 'bg-purple-100', 3),
('Negotiation', 'Price/terms negotiation in progress', 'bg-orange-100', 4),
('Closed Won', 'Sale completed successfully', 'bg-green-100', 5),
('Closed Lost', 'Sale lost to competition or customer decision', 'bg-red-100', 6)
ON CONFLICT DO NOTHING;

-- Create RLS policies for security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS Policy for leads
CREATE POLICY "Users can view leads from their store" ON public.leads
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert leads to their store" ON public.leads
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

CREATE POLICY "Users can update leads from their store" ON public.leads
    FOR UPDATE USING (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

-- RLS Policy for sales_reports
CREATE POLICY "Users can view sales reports from their store" ON public.sales_reports
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

CREATE POLICY "Floor managers can insert sales reports" ON public.sales_reports
    FOR INSERT WITH CHECK (
        floor_manager_id = auth.uid() AND
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Business admins can update sales reports" ON public.sales_reports
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

-- RLS Policy for sales
CREATE POLICY "Users can view sales from their store" ON public.sales
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

CREATE POLICY "Salespeople can insert sales" ON public.sales
    FOR INSERT WITH CHECK (
        salesperson_id = auth.uid() AND
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy for pipeline_stages
CREATE POLICY "Users can view pipeline stages from their store" ON public.pipeline_stages
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM public.team_members 
            WHERE user_id = auth.uid()
        ) OR 
        store_id IN (
            SELECT id FROM public.stores 
            WHERE business_admin_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.sales_reports TO authenticated;
GRANT ALL ON public.pipeline_stages TO authenticated;
GRANT ALL ON public.sales TO authenticated;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.update_lead_stage(
    lead_id UUID,
    new_stage VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
    UPDATE public.leads 
    SET stage = new_stage, last_updated = NOW()
    WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_lead_to_salesperson(
    lead_id UUID,
    salesperson_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.leads 
    SET assigned_to = salesperson_id, last_updated = NOW()
    WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.convert_lead_to_sale(
    lead_id UUID,
    product_sold TEXT,
    sale_amount DECIMAL(12,2),
    notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    sale_id UUID;
    lead_record RECORD;
BEGIN
    -- Get lead information
    SELECT * INTO lead_record FROM public.leads WHERE id = lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    -- Create sale record
    INSERT INTO public.sales (
        lead_id, customer_name, product_sold, sale_amount, 
        commission, notes, salesperson_id, floor, store_id
    ) VALUES (
        lead_id, lead_record.customer_name, product_sold, sale_amount,
        sale_amount * 0.02, notes, lead_record.assigned_to, 
        lead_record.floor, lead_record.store_id
    ) RETURNING id INTO sale_id;
    
    -- Update lead stage to closed_won
    UPDATE public.leads 
    SET stage = 'closed_won', last_updated = NOW()
    WHERE id = lead_id;
    
    RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for tracking changes
CREATE OR REPLACE FUNCTION public.audit_leads_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            table_name, record_id, action, old_values, new_values, 
            user_id, timestamp, store_id
        ) VALUES (
            'leads', NEW.id, 'INSERT', NULL, to_jsonb(NEW), 
            auth.uid(), NOW(), NEW.store_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            table_name, record_id, action, old_values, new_values, 
            user_id, timestamp, store_id
        ) VALUES (
            'leads', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), 
            auth.uid(), NOW(), NEW.store_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            table_name, record_id, action, old_values, new_values, 
            user_id, timestamp, store_id
        ) VALUES (
            'leads', OLD.id, 'DELETE', to_jsonb(OLD), NULL, 
            auth.uid(), NOW(), OLD.store_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger for leads
CREATE TRIGGER audit_leads_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.audit_leads_changes();

-- Create audit trigger for sales_reports
CREATE TRIGGER audit_sales_reports_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.sales_reports
    FOR EACH ROW EXECUTE FUNCTION public.audit_leads_changes();

-- Create audit trigger for sales
CREATE TRIGGER audit_sales_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.audit_leads_changes();

-- Insert sample data for testing (optional)
-- INSERT INTO public.leads (customer_name, customer_phone, product_interest, budget_range, floor, store_id) VALUES
-- ('Test Customer', '+91 99999 99999', 'Gold Ring', '₹50,000 - ₹1,00,000', 1, 1);

COMMENT ON TABLE public.leads IS 'Customer leads and sales pipeline tracking';
COMMENT ON TABLE public.sales_reports IS 'Weekly sales reports from floor managers';
COMMENT ON TABLE public.pipeline_stages IS 'Configurable sales pipeline stages';
COMMENT ON TABLE public.sales IS 'Completed sales transactions';
