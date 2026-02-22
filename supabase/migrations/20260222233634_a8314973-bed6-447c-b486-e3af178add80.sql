
-- Add end_date to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date date;

-- Add total_days to project_plans
ALTER TABLE public.project_plans ADD COLUMN IF NOT EXISTS total_days integer;
