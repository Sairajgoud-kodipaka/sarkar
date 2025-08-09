-- Add sample sales team members if they don't exist
INSERT INTO team_members (id, email, first_name, last_name, role, floor, phone, status)
VALUES 
  ('a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', 'rajesh.sales@company.com', 'Rajesh', 'Kumar', 'sales_associate', 1, '+91 98765 43210', 'active'),
  ('b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7', 'priya.sales@company.com', 'Priya', 'Sharma', 'sales_associate', 2, '+91 98765 43211', 'active'),
  ('c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8', 'amit.inhouse@company.com', 'Amit', 'Patel', 'inhouse_sales', 1, '+91 98765 43212', 'active'),
  ('d4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9', 'sneha.sales@company.com', 'Sneha', 'Singh', 'sales_associate', 3, '+91 98765 43213', 'active'),
  ('e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0', 'vikram.floor@company.com', 'Vikram', 'Reddy', 'floor_manager', 2, '+91 98765 43214', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verify the sales team members
SELECT 
  first_name, 
  last_name, 
  role, 
  floor, 
  email, 
  status 
FROM team_members 
WHERE role IN ('sales_associate', 'inhouse_sales', 'floor_manager')
ORDER BY role, first_name;
