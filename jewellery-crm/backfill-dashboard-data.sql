-- Backfill Dashboard Data Script
-- This script creates visit and sales records from existing customer and order data

-- Create visit records for existing customers (if not already exists)
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
);

-- Create sales records for existing confirmed/delivered orders (if not already exists)
INSERT INTO sales (customer_id, customer_name, amount, date, floor, created_by, created_at)
SELECT 
    o.customer_id,
    o.customer_name,
    o.total_amount as amount,
    COALESCE(o.order_date, CURRENT_DATE) as date,
    o.floor,
    o.created_by,
    o.created_at
FROM orders o
WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
AND NOT EXISTS (
    SELECT 1 FROM sales s 
    WHERE s.customer_name = o.customer_name 
    AND s.amount = o.total_amount 
    AND s.floor = o.floor
    AND s.created_at::date = o.created_at::date
);

-- Show summary of what was created
SELECT 
    'Visits' as table_name,
    COUNT(*) as records_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM visits
UNION ALL
SELECT 
    'Sales' as table_name,
    COUNT(*) as records_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM sales
ORDER BY table_name;
