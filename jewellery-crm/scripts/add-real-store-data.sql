-- Add Real Store Data with Names, Locations, Villages, and Addresses
-- This script will populate your stores table with real business data

-- First, let's check if stores table exists and create it if needed
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  village VARCHAR(255),
  address TEXT,
  floors INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert real store data
INSERT INTO stores (id, name, location, village, address, floors) VALUES
  (1, 'Jewellery Palace', 'Mumbai', 'Andheri West', 'Shop No. 15, Andheri West Market, Mumbai - 400058', 3),
  (2, 'Diamond World', 'Delhi', 'Connaught Place', 'Shop No. 8, Connaught Place, New Delhi - 110001', 2),
  (3, 'Gold Gallery', 'Bangalore', 'Koramangala', 'Shop No. 22, Koramangala 5th Block, Bangalore - 560034', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  village = EXCLUDED.village,
  address = EXCLUDED.address,
  floors = EXCLUDED.floors,
  updated_at = NOW();

-- Update existing customers to have proper store_id if they don't have one
UPDATE customers SET store_id = 1 WHERE store_id IS NULL OR store_id = 0;

-- Update existing products to have proper store_id if they don't have one
UPDATE products SET store_id = 1 WHERE store_id IS NULL OR store_id = 0;

-- Update existing sales to have proper store_id if they don't have one
UPDATE sales SET store_id = 1 WHERE store_id IS NULL OR store_id = 0;

-- Verify the data
SELECT 
  id,
  name,
  location,
  village,
  address,
  floors,
  created_at
FROM stores
ORDER BY id;

-- Show sample customer data with store information
SELECT 
  c.id,
  c.name,
  c.phone,
  c.floor,
  s.name as store_name,
  s.location,
  s.village
FROM customers c
JOIN stores s ON c.store_id = s.id
LIMIT 10;

