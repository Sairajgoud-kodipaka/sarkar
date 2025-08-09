-- Check customer floor distribution
SELECT 
    floor,
    COUNT(*) as customer_count,
    STRING_AGG(name, ', ') as customer_names
FROM customers 
GROUP BY floor 
ORDER BY floor;

-- Check individual customer details
SELECT 
    id,
    name, 
    floor, 
    phone,
    interest,
    created_at
FROM customers 
ORDER BY floor, name;

-- Check if there are any NULL or invalid floor values
SELECT 
    'Invalid Floor Values' as check_type,
    COUNT(*) as count
FROM customers 
WHERE floor IS NULL OR floor NOT IN (1, 2, 3)

UNION ALL

SELECT 
    'Total Customers' as check_type,
    COUNT(*) as count
FROM customers;
