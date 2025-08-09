-- Add Teja as a sales associate directly to the database

-- First, let's see if Teja already exists
SELECT * FROM team_members WHERE first_name = 'Teja' OR email LIKE '%teja%';

-- If Teja doesn't exist, add him
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
    gen_random_uuid(),  -- Generate a random UUID
    'teja@company.com',  -- Email for Teja
    'Teja',              -- First name
    'Singh',             -- Last name (adjust as needed)
    'sales_associate',   -- Role
    1,                   -- Floor (adjust as needed)
    '+91 98765 43220',   -- Phone number
    'active',            -- Status
    NOW(),               -- Created at
    NOW()                -- Updated at
)
ON CONFLICT (email) DO NOTHING;

-- Verify Teja was added
SELECT 
    first_name, 
    last_name, 
    email, 
    role, 
    floor, 
    status 
FROM team_members 
WHERE first_name = 'Teja';

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
ORDER BY role, floor, first_name;
