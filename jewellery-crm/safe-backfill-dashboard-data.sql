-- SAFE Dashboard Data Backfill Script
-- This script creates visit and sales records from existing customer and order data
-- Based on your current database schema

-- Step 1: Create visit records for existing customers (safe - checks for duplicates)
INSERT INTO visits (customer_id, customer_name, floor, date, interest, created_at)
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.floor,
    c.visited_date as date,
    COALESCE(c.interest, 'General Interest') as interest,
    c.created_at
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM visits v 
    WHERE v.customer_id = c.id 
    AND v.customer_name = c.name 
    AND v.floor = c.floor
    AND v.date = c.visited_date
);

-- Step 2: Create sales records for existing confirmed/delivered orders (safe - checks for duplicates)
INSERT INTO sales (customer_id, customer_name, amount, date, floor, created_by, created_at)
SELECT 
    o.customer_id,
    o.customer_name,
    o.total_amount as amount,
    CURRENT_DATE as date, -- Use today's date since orders don't have order_date
    o.floor,
    o.created_by,
    o.created_at
FROM orders o
WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
AND o.floor IS NOT NULL -- Only orders with floor info
AND NOT EXISTS (
    SELECT 1 FROM sales s 
    WHERE s.customer_name = o.customer_name 
    AND s.amount = o.total_amount 
    AND s.floor = o.floor
    AND s.created_by = o.created_by
);

-- Step 3: Show summary of current data (safe read-only query)
SELECT 
    'Summary Report' as report_type,
    'Visits' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as today_count,
    COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_count,
    COUNT(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM visits
WHERE floor = 1 -- Change this to your floor number (1, 2, or 3)

UNION ALL

SELECT 
    'Summary Report' as report_type,
    'Sales' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as today_count,
    COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_count,
    COUNT(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM sales
WHERE floor = 1 -- Change this to your floor number (1, 2, or 3)

ORDER BY table_name;

-- Step 4: Show floor-specific breakdown (safe read-only query)
SELECT 
    'Floor Breakdown' as report_type,
    floor,
    'Visits' as data_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as today_count
FROM visits
GROUP BY floor

UNION ALL

SELECT 
    'Floor Breakdown' as report_type,
    floor,
    'Sales' as data_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as today_count
FROM sales
GROUP BY floor

ORDER BY floor, data_type;
