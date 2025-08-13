-- SQL Script to Add Users to Supabase (No employee_id field)
-- This script works with your existing team_members table structure
-- Run this in your Supabase SQL editor

-- First, let's create a function to add users programmatically
CREATE OR REPLACE FUNCTION add_team_member(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_floor INTEGER,
  p_phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert into team_members table
  INSERT INTO public.team_members (
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
  ) VALUES (
    gen_random_uuid(),
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    p_floor,
    p_phone,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now let's add all the users

-- 👑 Admin (1 user)
SELECT add_team_member(
  'admin.divesh@sarkarjewellers.com',
  'Divesh',
  'Sarkar',
  'business_admin',
  NULL, -- Admin doesn't have a specific floor
  NULL
);

-- 🏪 Manager (1 user)
SELECT add_team_member(
  'satellite.manager@sarkarjewellers.com',
  'Satellite',
  'Manager',
  'floor_manager',
  1, -- Assuming Satellite Store is on floor 1
  NULL
);

-- 🧑‍💼 Salespeople (26 users) - Floor 1
SELECT add_team_member('chiragbhai@sarkarjewellers.com', 'Chiragbhai', '', 'sales_associate', 1, NULL);
SELECT add_team_member('bhumiben@sarkarjewellers.com', 'Bhumiben', '', 'sales_associate', 1, NULL);
SELECT add_team_member('meet@sarkarjewellers.com', 'Meet', '', 'sales_associate', 1, NULL);
SELECT add_team_member('karina@sarkarjewellers.com', 'Karina', '', 'sales_associate', 1, NULL);
SELECT add_team_member('manojbhai@sarkarjewellers.com', 'Manojbhai', '', 'sales_associate', 1, NULL);

-- 🧑‍💼 Salespeople - Floor 2
SELECT add_team_member('ashok@sarkarjewellers.com', 'Ashok', '', 'sales_associate', 2, NULL);
SELECT add_team_member('chintan@sarkarjewellers.com', 'Chintan', '', 'sales_associate', 2, NULL);
SELECT add_team_member('karan@sarkarjewellers.com', 'Karan', '', 'sales_associate', 2, NULL);
SELECT add_team_member('nilja@sarkarjewellers.com', 'Nilja', '', 'sales_associate', 2, NULL);
SELECT add_team_member('sonal.r@sarkarjewellers.com', 'Sonal', 'R', 'sales_associate', 2, NULL);
SELECT add_team_member('shreya@sarkarjewellers.com', 'Shreya', '', 'sales_associate', 2, NULL);
SELECT add_team_member('rushil@sarkarjewellers.com', 'Rushil', '', 'sales_associate', 2, NULL);
SELECT add_team_member('mittal@sarkarjewellers.com', 'Mittal', '', 'sales_associate', 2, NULL);

-- 🧑‍💼 Salespeople - Floor 3
SELECT add_team_member('upendrakaka@sarkarjewellers.com', 'Upendrakaka', '', 'sales_associate', 3, NULL);
SELECT add_team_member('kundan@sarkarjewellers.com', 'Kundan', '', 'sales_associate', 3, NULL);
SELECT add_team_member('sonal.p@sarkarjewellers.com', 'Sonal', 'P', 'sales_associate', 3, NULL);
SELECT add_team_member('pragnyaben@sarkarjewellers.com', 'Pragnyaben', '', 'sales_associate', 3, NULL);
SELECT add_team_member('amitkaka@sarkarjewellers.com', 'Amitkaka', '', 'sales_associate', 3, NULL);
SELECT add_team_member('umeshkaka@sarkarjewellers.com', 'Umeshkaka', '', 'sales_associate', 3, NULL);
SELECT add_team_member('amiben@sarkarjewellers.com', 'Amiben', '', 'sales_associate', 3, NULL);
SELECT add_team_member('ishwarbhai@sarkarjewellers.com', 'Ishwarbhai', '', 'sales_associate', 3, NULL);
SELECT add_team_member('jigneshbhai@sarkarjewellers.com', 'Jigneshbhai', '', 'sales_associate', 3, NULL);
SELECT add_team_member('charmi@sarkarjewellers.com', 'Charmi', '', 'sales_associate', 3, NULL);
SELECT add_team_member('pareshbhai@sarkarjewellers.com', 'Pareshbhai', '', 'sales_associate', 3, NULL);
SELECT add_team_member('pratik@sarkarjewellers.com', 'Pratik', '', 'sales_associate', 3, NULL);
SELECT add_team_member('nikitaben@sarkarjewellers.com', 'Nikitaben', '', 'sales_associate', 3, NULL);

-- Verify the users were added
SELECT 
  email,
  first_name,
  last_name,
  role,
  floor,
  status,
  created_at
FROM public.team_members 
WHERE email LIKE '%@sarkarjewellers.com'
ORDER BY role, floor, first_name;

-- Clean up the helper function
DROP FUNCTION IF EXISTS add_team_member(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT);
