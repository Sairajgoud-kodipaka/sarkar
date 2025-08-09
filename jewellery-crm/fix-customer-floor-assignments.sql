-- Fix Customer Floor Assignments
-- Redistribute customers across floors 1, 2, and 3

-- First, let's see the current customers
SELECT 'Before Fix - Current customers:' as status, id, name, floor FROM customers ORDER BY id;

-- Update customers to distribute them across floors
-- Let's assign customers to floors in a balanced way

-- Assign first 4 customers to Floor 1
UPDATE customers 
SET floor = 1 
WHERE id IN (
    SELECT id FROM customers ORDER BY id LIMIT 4
);

-- Assign next 3 customers to Floor 2  
UPDATE customers 
SET floor = 2 
WHERE id IN (
    SELECT id FROM customers ORDER BY id OFFSET 4 LIMIT 3
);

-- Assign remaining customers to Floor 3
UPDATE customers 
SET floor = 3 
WHERE id IN (
    SELECT id FROM customers ORDER BY id OFFSET 7
);

-- Show the results after fix
SELECT 'After Fix - Distribution:' as status, floor, COUNT(*) as customer_count 
FROM customers 
GROUP BY floor 
ORDER BY floor;

-- Show detailed customer assignments
SELECT 'After Fix - Customer Details:' as status, id, name, floor 
FROM customers 
ORDER BY floor, name;
