-- Check current state - fix the data type mismatch
SELECT 
    'team_members' as source,
    id::text, 
    email, 
    first_name, 
    last_name, 
    role, 
    floor::text as floor
FROM team_members 
WHERE email = 'dhmteja786@gmail.com'

UNION ALL

SELECT 
    'auth.users' as source,
    id::text, 
    email, 
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'floor' as floor
FROM auth.users 
WHERE email = 'dhmteja786@gmail.com';

-- Fix: Update team_members with correct auth UUID
UPDATE team_members 
SET 
    id = 'f61e7b10-cbdd-4d23-ac77-555a067c978a',  -- Teja's real auth UUID
    first_name = 'teja',
    last_name = 'kala', 
    role = 'sales_associate',
    floor = 2,
    phone = '+919030069897',
    updated_at = NOW()
WHERE email = 'dhmteja786@gmail.com';

-- Verify fix worked
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

-- Show all sales team members
SELECT 
    first_name, 
    last_name, 
    email, 
    role, 
    floor, 
    status 
FROM team_members 
WHERE role IN ('sales_associate', 'inhouse_sales', 'floor_manager')
ORDER BY floor, first_name;
