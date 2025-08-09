-- Debug Team Members Loading Issue
-- Check if team members exist and what roles they have

-- Check total team members
SELECT 
    'Total Team Members' as check_type,
    COUNT(*) as count
FROM team_members;

-- Check team members by role
SELECT 
    'Team Members by Role' as check_type,
    role,
    COUNT(*) as count,
    STRING_AGG(first_name || ' ' || last_name, ', ') as members
FROM team_members 
GROUP BY role 
ORDER BY role;

-- Check specific roles that should appear in dropdown
SELECT 
    'Sales Team Members' as check_type,
    id,
    first_name,
    last_name,
    role,
    status,
    floor,
    created_at::date as created_date
FROM team_members 
WHERE role IN ('sales_associate', 'floor_manager', 'inhouse_sales')
ORDER BY role, first_name;

-- Check for any data issues
SELECT 
    'Data Quality Check' as check_type,
    'Missing Names' as issue_type,
    COUNT(*) as count
FROM team_members 
WHERE first_name IS NULL OR last_name IS NULL OR first_name = '' OR last_name = ''

UNION ALL

SELECT 
    'Data Quality Check' as check_type,
    'Inactive Members' as issue_type,
    COUNT(*) as count
FROM team_members 
WHERE status != 'active'

UNION ALL

SELECT 
    'Data Quality Check' as check_type,
    'Valid Sales Team' as issue_type,
    COUNT(*) as count
FROM team_members 
WHERE role IN ('sales_associate', 'floor_manager', 'inhouse_sales')
AND status = 'active'
AND first_name IS NOT NULL 
AND last_name IS NOT NULL;
