-- Debug Customer Floor Assignment Issue
-- Check if all customers are really assigned to Floor 1

-- First, let's see the actual distribution
SELECT 
    'Current Distribution' as query_type,
    floor,
    COUNT(*) as customer_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 2) as percentage
FROM customers 
GROUP BY floor 
ORDER BY floor;

-- Check the specific customers and their floor assignments
SELECT 
    'Customer Details' as query_type,
    id,
    name,
    floor,
    phone,
    interest,
    visited_date,
    created_at::date as created_date
FROM customers 
ORDER BY floor, name;

-- Check for data integrity issues
SELECT 
    'Data Integrity Check' as query_type,
    'Invalid Floor Values' as issue_type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as affected_customers
FROM customers 
WHERE floor IS NULL OR floor NOT IN (1, 2, 3)

UNION ALL

SELECT 
    'Data Integrity Check' as query_type,
    'All Customers Total' as issue_type,
    COUNT(*) as count,
    'N/A' as affected_customers
FROM customers;

-- Check if floor is being stored as text instead of integer
SELECT 
    'Floor Data Type Check' as query_type,
    floor,
    pg_typeof(floor) as data_type,
    COUNT(*) as count
FROM customers 
GROUP BY floor, pg_typeof(floor)
ORDER BY floor;
