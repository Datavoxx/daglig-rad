-- Add estimate_id column to project_work_orders
ALTER TABLE public.project_work_orders 
ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES public.project_estimates(id) ON DELETE SET NULL;

-- Fix inspections foreign key to allow project deletion
ALTER TABLE public.inspections
DROP CONSTRAINT IF EXISTS inspections_project_id_fkey;

ALTER TABLE public.inspections
ADD CONSTRAINT inspections_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Also fix other tables that might block project deletion
ALTER TABLE public.daily_reports
DROP CONSTRAINT IF EXISTS daily_reports_project_id_fkey;

ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_plans
DROP CONSTRAINT IF EXISTS project_plans_project_id_fkey;

ALTER TABLE public.project_plans
ADD CONSTRAINT project_plans_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_ata
DROP CONSTRAINT IF EXISTS project_ata_project_id_fkey;

ALTER TABLE public.project_ata
ADD CONSTRAINT project_ata_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_work_orders
DROP CONSTRAINT IF EXISTS project_work_orders_project_id_fkey;

ALTER TABLE public.project_work_orders
ADD CONSTRAINT project_work_orders_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_files
DROP CONSTRAINT IF EXISTS project_files_project_id_fkey;

ALTER TABLE public.project_files
ADD CONSTRAINT project_files_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;