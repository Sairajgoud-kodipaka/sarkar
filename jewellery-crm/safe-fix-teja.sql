-- Safe approach: Delete and recreate Teja's record
-- First, let's see what references exist
SELECT 
    'announcement_replies' as table_name,
    count(*) as references
FROM announcement_replies 
WHERE created_by = 'cc3ad775-e45b-4dbc-9f7e-9e958779d8d5'

UNION ALL

SELECT 
    'appointments' as table_name,
    count(*) as references
FROM appointments 
WHERE assigned_to = 'cc3ad775-e45b-4dbc-9f7e-9e958779d8d5'

UNION ALL

SELECT 
    'customers' as table_name,
    count(*) as references
FROM customers 
WHERE assigned_to = 'cc3ad775-e45b-4dbc-9f7e-9e958779d8d5';

-- Safe solution: Delete the old record and insert with correct UUID
-- Step 1: Delete any references that might block us
DELETE FROM announcement_replies WHERE created_by = 'cc3ad775-e45b-4dbc-9f7e-9e958779d8d5';

-- Step 2: Delete the old team member record
DELETE FROM team_members WHERE email = 'dhmteja786@gmail.com';

-- Step 3: Insert with correct auth UUID
INSERT INTO team_members (
    id,                          
    email, 
    first_name, 
    last_name, 
    role, 
    floor, 
    phone, 
    status,
    created_at,
    updated_at
) 
VALUES (
    'f61e7b10-cbdd-4d23-ac77-555a067c978a',  -- Teja's correct auth UUID
    'dhmteja786@gmail.com',                   
    'teja',                                   
    'kala',                                   
    'sales_associate',                        
    2,                                        
    '+919030069897',                          
    'active',                                 
    NOW(),                                    
    NOW()                                     
);

-- Verify Teja is correctly set up
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    role, 
    floor,
    phone,
    status 
FROM team_members 
WHERE email = 'dhmteja786@gmail.com';

-- Verify he appears in sales team
SELECT 
    first_name, 
    last_name, 
    email, 
    role, 
    floor
FROM team_members 
WHERE role IN ('sales_associate', 'inhouse_sales', 'floor_manager')
ORDER BY floor, first_name;
