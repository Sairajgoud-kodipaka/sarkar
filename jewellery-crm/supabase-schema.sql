-- Sarkar CRM Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for team member management
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('business_admin', 'floor_manager', 'sales_associate', 'support_staff', 'admin')),
    floor INTEGER CHECK (floor IN (1, 2, 3)),
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    interest TEXT NOT NULL,
    floor INTEGER NOT NULL CHECK (floor IN (1, 2, 3)),
    visited_date DATE NOT NULL,
    assigned_to UUID REFERENCES team_members(id),
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image TEXT,
    description TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    floor INTEGER NOT NULL CHECK (floor IN (1, 2, 3)),
    created_by UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    floor INTEGER NOT NULL CHECK (floor IN (1, 2, 3)),
    date DATE NOT NULL,
    interest TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_floor ON team_members(floor);
CREATE INDEX IF NOT EXISTS idx_customers_floor ON customers(floor);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_floor ON sales(floor);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_floor ON visits(floor);

-- Enable Row Level Security (RLS)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_members
CREATE POLICY "Business admins can manage all team members" ON team_members
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
    );

CREATE POLICY "Users can view their own profile" ON team_members
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Create RLS policies

-- Customers policies
CREATE POLICY "Business admins can manage all customers" ON customers
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
    );

CREATE POLICY "Floor managers can view customers on their floor" ON customers
    FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Floor managers can insert customers on their floor" ON customers
    FOR INSERT WITH CHECK (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Floor managers can update customers on their floor" ON customers
    FOR UPDATE USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

-- Products policies
CREATE POLICY "Business admins can manage all products" ON products
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
    );

CREATE POLICY "Floor managers can view all products" ON products
    FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager'
    );

-- Sales policies
CREATE POLICY "Business admins can manage all sales" ON sales
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
    );

CREATE POLICY "Floor managers can view sales on their floor" ON sales
    FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Floor managers can insert sales on their floor" ON sales
    FOR INSERT WITH CHECK (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

-- Visits policies
CREATE POLICY "Business admins can manage all visits" ON visits
    FOR ALL USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
    );

CREATE POLICY "Floor managers can view visits on their floor" ON visits
    FOR SELECT USING (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Floor managers can insert visits on their floor" ON visits
    FOR INSERT WITH CHECK (
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'floor_manager' AND
        floor = (SELECT (raw_user_meta_data->>'floor')::int FROM auth.users WHERE id = auth.uid())
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO products (name, sku, type, category, price, description, stock_quantity) VALUES
('Traditional Gold Necklace', 'GOLD-NECK-001', 'Necklace', 'Gold', 75000.00, 'Traditional 22K gold necklace with intricate design', 5),
('Diamond Solitaire Ring', 'DIAMOND-RING-001', 'Ring', 'Diamond', 150000.00, '1 carat diamond solitaire ring in white gold', 3),
('Silver Filigree Earrings', 'SILVER-EAR-001', 'Earrings', 'Silver', 8500.00, 'Handcrafted silver filigree earrings', 12),
('Platinum Chain', 'PLATINUM-CHAIN-001', 'Chain', 'Platinum', 95000.00, 'Pure platinum chain with modern design', 2),
('Pearl Drop Earrings', 'PEARL-EAR-001', 'Earrings', 'Pearl', 25000.00, 'South sea pearl drop earrings', 8),
('Gold Bangles Set', 'GOLD-BANGLE-001', 'Bangles', 'Gold', 45000.00, 'Set of 4 traditional gold bangles', 6),
('Diamond Studs', 'DIAMOND-STUD-001', 'Earrings', 'Diamond', 75000.00, '0.5 carat diamond studs', 4),
('Silver Necklace', 'SILVER-NECK-001', 'Necklace', 'Silver', 12000.00, 'Contemporary silver necklace', 15)
ON CONFLICT (sku) DO NOTHING;

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  customer_id integer,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  appointment_date timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  assigned_to uuid,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT appointments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id)
);

CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);

CREATE TABLE public.customers (
  id integer NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  name text NOT NULL,
  phone text NOT NULL,
  interest text NOT NULL,
  floor integer NOT NULL CHECK (floor = ANY (ARRAY[1, 2, 3])),
  visited_date date NOT NULL,
  assigned_to uuid,
  notes text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
);
