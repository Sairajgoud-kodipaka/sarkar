-- Quick Fix: Add missing amount column to leads table
-- Run this immediately to fix the "amount column not found" error

-- Add the missing amount column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;

-- Add product_id column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_id INTEGER;

-- Add product_name column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

-- Add product_price column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_price DECIMAL(10,2);

-- Set default values for existing records
UPDATE leads SET amount = 0 WHERE amount IS NULL;
UPDATE leads SET product_id = 0 WHERE product_id IS NULL;

-- Verify the fix
SELECT 'amount' as column_name, 
       (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'amount') as data_type,
       'Column added successfully' as status
UNION ALL
SELECT 'product_id' as column_name,
       (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'product_id') as data_type,
       'Column added successfully' as status;
-- Run this immediately to fix the "amount column not found" error

-- Add the missing amount column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;

-- Add product_id column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_id INTEGER;

-- Add product_name column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

-- Add product_price column if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_price DECIMAL(10,2);

-- Set default values for existing records
UPDATE leads SET amount = 0 WHERE amount IS NULL;
UPDATE leads SET product_id = 0 WHERE product_id IS NULL;

-- Verify the fix
SELECT 'amount' as column_name, 
       (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'amount') as data_type,
       'Column added successfully' as status
UNION ALL
SELECT 'product_id' as column_name,
       (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'product_id') as data_type,
       'Column added successfully' as status;
