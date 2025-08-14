-- Sample Sales Reports Data for Testing
-- This file contains sample data to test the sales reports functionality

-- Insert sample sales reports
INSERT INTO public.sales_reports (
  floor_manager_id,
  floor,
  week_start,
  week_end,
  total_leads,
  converted_leads,
  total_revenue,
  status,
  notes,
  store_id,
  submitted_at
) VALUES 
-- Store 1, Floor 1 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor1_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  25,
  8,
  450000.00,
  'pending',
  'Strong performance this week, good customer engagement. Team exceeded targets.',
  1,
  '2025-08-17T18:00:00Z'
),

-- Store 1, Floor 2 - Approved Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor2_manager@example.com' LIMIT 1),
  2,
  '2025-08-11',
  '2025-08-17',
  18,
  6,
  320000.00,
  'approved',
  'Met weekly targets, team performing well. Good conversion rate.',
  1,
  '2025-08-17T17:30:00Z'
),

-- Store 1, Floor 3 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor3_manager@example.com' LIMIT 1),
  3,
  '2025-08-11',
  '2025-08-17',
  15,
  4,
  280000.00,
  'pending',
  'Steady performance, room for improvement in conversion rate.',
  1,
  '2025-08-17T19:00:00Z'
),

-- Store 2, Floor 1 - Approved Report
(
  (SELECT id FROM public.team_members WHERE email = 'store2_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  12,
  5,
  180000.00,
  'approved',
  'Good week for Store 2, team building momentum.',
  2,
  '2025-08-17T16:45:00Z'
),

-- Store 3, Floor 1 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'store3_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  8,
  3,
  120000.00,
  'pending',
  'New store performance, building customer base.',
  3,
  '2025-08-17T20:15:00Z'
);

-- If team members don't exist, create them first
-- Uncomment and run this section if you need to create team members

/*
INSERT INTO public.team_members (
  id,
  email,
  first_name,
  last_name,
  role,
  floor,
  store_id,
  status
) VALUES 
(
  gen_random_uuid(),
  'floor1_manager@example.com',
  'John',
  'Manager',
  'floor_manager',
  1,
  1,
  'active'
),
(
  gen_random_uuid(),
  'floor2_manager@example.com',
  'Sarah',
  'Lead',
  'floor_manager',
  2,
  1,
  'active'
),
(
  gen_random_uuid(),
  'floor3_manager@example.com',
  'Mike',
  'Supervisor',
  'floor_manager',
  3,
  1,
  'active'
),
(
  gen_random_uuid(),
  'store2_manager@example.com',
  'Priya',
  'Sharma',
  'floor_manager',
  1,
  2,
  'active'
),
(
  gen_random_uuid(),
  'store3_manager@example.com',
  'Raj',
  'Kumar',
  'floor_manager',
  1,
  3,
  'active'
);
*/

-- Verify the data was inserted
SELECT 
  sr.id,
  tm.first_name || ' ' || tm.last_name as manager_name,
  sr.floor,
  sr.week_start,
  sr.week_end,
  sr.total_leads,
  sr.converted_leads,
  sr.total_revenue,
  sr.status,
  s.name as store_name
FROM public.sales_reports sr
JOIN public.team_members tm ON sr.floor_manager_id = tm.id
JOIN public.stores s ON sr.store_id = s.id
ORDER BY sr.submitted_at DESC;
-- This file contains sample data to test the sales reports functionality

-- Insert sample sales reports
INSERT INTO public.sales_reports (
  floor_manager_id,
  floor,
  week_start,
  week_end,
  total_leads,
  converted_leads,
  total_revenue,
  status,
  notes,
  store_id,
  submitted_at
) VALUES 
-- Store 1, Floor 1 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor1_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  25,
  8,
  450000.00,
  'pending',
  'Strong performance this week, good customer engagement. Team exceeded targets.',
  1,
  '2025-08-17T18:00:00Z'
),

-- Store 1, Floor 2 - Approved Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor2_manager@example.com' LIMIT 1),
  2,
  '2025-08-11',
  '2025-08-17',
  18,
  6,
  320000.00,
  'approved',
  'Met weekly targets, team performing well. Good conversion rate.',
  1,
  '2025-08-17T17:30:00Z'
),

-- Store 1, Floor 3 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'floor3_manager@example.com' LIMIT 1),
  3,
  '2025-08-11',
  '2025-08-17',
  15,
  4,
  280000.00,
  'pending',
  'Steady performance, room for improvement in conversion rate.',
  1,
  '2025-08-17T19:00:00Z'
),

-- Store 2, Floor 1 - Approved Report
(
  (SELECT id FROM public.team_members WHERE email = 'store2_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  12,
  5,
  180000.00,
  'approved',
  'Good week for Store 2, team building momentum.',
  2,
  '2025-08-17T16:45:00Z'
),

-- Store 3, Floor 1 - Pending Report
(
  (SELECT id FROM public.team_members WHERE email = 'store3_manager@example.com' LIMIT 1),
  1,
  '2025-08-11',
  '2025-08-17',
  8,
  3,
  120000.00,
  'pending',
  'New store performance, building customer base.',
  3,
  '2025-08-17T20:15:00Z'
);

-- If team members don't exist, create them first
-- Uncomment and run this section if you need to create team members

/*
INSERT INTO public.team_members (
  id,
  email,
  first_name,
  last_name,
  role,
  floor,
  store_id,
  status
) VALUES 
(
  gen_random_uuid(),
  'floor1_manager@example.com',
  'John',
  'Manager',
  'floor_manager',
  1,
  1,
  'active'
),
(
  gen_random_uuid(),
  'floor2_manager@example.com',
  'Sarah',
  'Lead',
  'floor_manager',
  2,
  1,
  'active'
),
(
  gen_random_uuid(),
  'floor3_manager@example.com',
  'Mike',
  'Supervisor',
  'floor_manager',
  3,
  1,
  'active'
),
(
  gen_random_uuid(),
  'store2_manager@example.com',
  'Priya',
  'Sharma',
  'floor_manager',
  1,
  2,
  'active'
),
(
  gen_random_uuid(),
  'store3_manager@example.com',
  'Raj',
  'Kumar',
  'floor_manager',
  1,
  3,
  'active'
);
*/

-- Verify the data was inserted
SELECT 
  sr.id,
  tm.first_name || ' ' || tm.last_name as manager_name,
  sr.floor,
  sr.week_start,
  sr.week_end,
  sr.total_leads,
  sr.converted_leads,
  sr.total_revenue,
  sr.status,
  s.name as store_name
FROM public.sales_reports sr
JOIN public.team_members tm ON sr.floor_manager_id = tm.id
JOIN public.stores s ON sr.store_id = s.id
ORDER BY sr.submitted_at DESC;
