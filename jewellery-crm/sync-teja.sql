-- Sync Teja from auth.users to team_members table using his actual data

-- Insert Teja into team_members table with his exact details
INSERT INTO team_members (
    id,                          -- Use his UUID from auth
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
    'f61e7b10-cbdd-4d23-ac77-555a067c978a',  -- Teja's exact UUID
    'dhmteja786@gmail.com',                   -- His email
    'teja',                                   -- First name
    'kala',                                   -- Last name  
    'sales_associate',                        -- Role
    2,                                        -- Floor 2
    '+919030069897',                          -- Phone number
    'active',                                 -- Status
    NOW(),                                    -- Created at
    NOW()                                     -- Updated at
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    floor = EXCLUDED.floor,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Verify Teja was added successfully
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
WHERE id = 'f61e7b10-cbdd-4d23-ac77-555a067c978a';

-- Show all sales team members to confirm Teja is there
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
