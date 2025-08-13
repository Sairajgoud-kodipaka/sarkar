-- =====================================================
-- FIX AUDIT LOGS TABLE SCHEMA
-- =====================================================
-- This script fixes the missing additional_context column and action constraints
-- Run this in your Supabase SQL editor to resolve the schema mismatch

-- Add missing additional_context column
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS additional_context jsonb;

-- Update the action constraint to include all actions used in triggers
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_action_check 
CHECK (action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'restore'::text, 'login'::text, 'logout'::text, 'export'::text, 'import'::text]));

-- Add index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;
