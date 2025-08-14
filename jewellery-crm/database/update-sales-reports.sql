-- Update sales_reports table to support automated reports
-- Run this to update the existing table structure

-- Add new columns for automated reports
ALTER TABLE sales_reports ADD COLUMN IF NOT EXISTS period VARCHAR(20); -- 'today', 'week', 'month'
ALTER TABLE sales_reports ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales_reports ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales_reports ADD COLUMN IF NOT EXISTS report_data JSONB; -- Store the actual CSV data

-- Update existing records to have default values
UPDATE sales_reports SET period = 'week' WHERE period IS NULL;
UPDATE sales_reports SET start_date = NOW() WHERE start_date IS NULL;
UPDATE sales_reports SET end_date = NOW() WHERE end_date IS NULL;

-- Make new columns required for future records
ALTER TABLE sales_reports ALTER COLUMN period SET NOT NULL;
ALTER TABLE sales_reports ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE sales_reports ALTER COLUMN end_date SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_reports_floor_period ON sales_reports(floor, period);
CREATE INDEX IF NOT EXISTS idx_sales_reports_date_range ON sales_reports(start_date, end_date);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
ORDER BY ordinal_position;
