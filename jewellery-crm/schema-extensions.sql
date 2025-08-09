-- Schema Extensions for Mock Data Replacement
-- Run these after your main schema to support additional features

-- 1. Sales Pipeline / Deals Table
-- Drop and recreate to ensure correct structure
DROP TABLE IF EXISTS deals CASCADE;

CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    stage TEXT NOT NULL CHECK (stage IN ('lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    assigned_to UUID REFERENCES team_members(id),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders Management Tables
-- Drop and recreate to ensure correct structure
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    created_by UUID REFERENCES team_members(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Support Tickets Table
-- Drop and recreate to ensure correct structure
DROP TABLE IF EXISTS support_tickets CASCADE;

CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES team_members(id),
    created_by UUID REFERENCES team_members(id),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enhanced Customer Profile (if needed for Business Admin complex interface)
-- Add these columns to existing customers table if you want to support the complex interface
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'walk_in';
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_metal TEXT;
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS budget_range TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_floor ON deals(floor);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_floor ON orders(floor);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_floor ON support_tickets(floor);

-- RLS DISABLED - All users can access all data
-- Uncomment below if you want to enable Row Level Security later

-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Deals (DISABLED)
-- CREATE POLICY "Business admins can manage all deals" ON deals
--     FOR ALL USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
--     );

-- CREATE POLICY "Floor managers can view deals on their floor" ON deals
--     FOR SELECT USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
--         floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
--     );

-- CREATE POLICY "Sales associates can view their assigned deals" ON deals
--     FOR SELECT USING (
--         assigned_to = auth.uid()
--     );

-- RLS Policies for Orders (DISABLED)
-- CREATE POLICY "Business admins can manage all orders" ON orders
--     FOR ALL USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
--     );

-- CREATE POLICY "Floor managers can view orders on their floor" ON orders
--     FOR SELECT USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
--         floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
--     );

-- RLS Policies for Support Tickets (DISABLED)
-- CREATE POLICY "Business admins can manage all support tickets" ON support_tickets
--     FOR ALL USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
--     );

-- CREATE POLICY "Floor managers can view tickets on their floor" ON support_tickets
--     FOR SELECT USING (
--         (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
--         floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
--     );

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO deals (title, customer_name, amount, stage, probability, expected_close_date, floor) VALUES
('Gold Necklace Sale', 'Priya Sharma', 75000.00, 'qualified', 75, '2024-02-15', 1),
('Diamond Ring Purchase', 'Rajesh Kumar', 120000.00, 'negotiation', 90, '2024-02-20', 1),
('Wedding Collection', 'Anita Patel', 250000.00, 'proposal', 60, '2024-03-01', 2),
('Silver Jewelry Set', 'Vikram Singh', 45000.00, 'lead', 30, '2024-02-25', 3)
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_name, total_amount, status, floor) VALUES
('Meera Shah', 85000.00, 'confirmed', 1),
('Amit Patel', 120000.00, 'processing', 2),
('Kavya Reddy', 65000.00, 'pending', 1),
('Ravi Kumar', 95000.00, 'shipped', 3)
ON CONFLICT DO NOTHING;
