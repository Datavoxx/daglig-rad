
-- Add employee_role column to employees table
ALTER TABLE public.employees ADD COLUMN employee_role text NOT NULL DEFAULT 'worker';

-- Add employee_role column to employee_invitations table
ALTER TABLE public.employee_invitations ADD COLUMN employee_role text NOT NULL DEFAULT 'worker';
