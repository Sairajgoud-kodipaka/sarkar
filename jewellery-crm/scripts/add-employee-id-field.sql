-- Migration: Add employee_id field to team_members table
-- Run this in your Supabase SQL editor before adding users

-- Add employee_id column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Add unique constraint on employee_id
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_employee_id_unique 
UNIQUE (employee_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id 
ON public.team_members(employee_id);

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
AND table_schema = 'public'
ORDER BY ordinal_position;
