-- Safe Update for sales_reports table to support automated reports
-- This script checks existing columns before making changes

-- First, let's see what columns currently exist
DO $$
BEGIN
    RAISE NOTICE 'Current sales_reports table structure:';
    RAISE NOTICE '=====================================';
END $$;

-- Check current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
ORDER BY ordinal_position;

-- Add new columns for automated reports (only if they don't exist)
DO $$
BEGIN
    -- Add period column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'period') THEN
        ALTER TABLE sales_reports ADD COLUMN period VARCHAR(20);
        RAISE NOTICE 'Added period column';
    ELSE
        RAISE NOTICE 'period column already exists';
    END IF;

    -- Add start_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'start_date') THEN
        ALTER TABLE sales_reports ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added start_date column';
    ELSE
        RAISE NOTICE 'start_date column already exists';
    END IF;

    -- Add end_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'end_date') THEN
        ALTER TABLE sales_reports ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added end_date column';
    ELSE
        RAISE NOTICE 'end_date column already exists';
    END IF;

    -- Add report_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'report_data') THEN
        ALTER TABLE sales_reports ADD COLUMN report_data JSONB;
        RAISE NOTICE 'Added report_data column';
    ELSE
        RAISE NOTICE 'report_data column already exists';
    END IF;
END $$;

-- Set default values for new columns
UPDATE sales_reports SET period = 'week' WHERE period IS NULL;
UPDATE sales_reports SET start_date = NOW() WHERE start_date IS NULL;
UPDATE sales_reports SET end_date = NOW() WHERE end_date IS NULL;

-- Make new columns required for future records (only if they exist)
DO $$
BEGIN
    -- Make period required
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'period') THEN
        ALTER TABLE sales_reports ALTER COLUMN period SET NOT NULL;
        RAISE NOTICE 'Made period column NOT NULL';
    END IF;

    -- Make start_date required
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'start_date') THEN
        ALTER TABLE sales_reports ALTER COLUMN start_date SET NOT NULL;
        RAISE NOTICE 'Made start_date column NOT NULL';
    END IF;

    -- Make end_date required
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_reports' AND column_name = 'end_date') THEN
        ALTER TABLE sales_reports ALTER COLUMN end_date SET NOT NULL;
        RAISE NOTICE 'Made end_date column NOT NULL';
    END IF;
END $$;

-- Add indexes for better performance (only if they don't exist)
DO $$
BEGIN
    -- Add floor_period index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sales_reports' AND indexname = 'idx_sales_reports_floor_period') THEN
        CREATE INDEX idx_sales_reports_floor_period ON sales_reports(floor, period);
        RAISE NOTICE 'Added floor_period index';
    ELSE
        RAISE NOTICE 'floor_period index already exists';
    END IF;

    -- Add date_range index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sales_reports' AND indexname = 'idx_sales_reports_date_range') THEN
        CREATE INDEX idx_sales_reports_date_range ON sales_reports(start_date, end_date);
        RAISE NOTICE 'Added date_range index';
    ELSE
        RAISE NOTICE 'date_range index already exists';
    END IF;
END $$;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Updated sales_reports table structure:';
    RAISE NOTICE '=====================================';
END $$;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
ORDER BY ordinal_position;
