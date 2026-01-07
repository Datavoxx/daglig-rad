-- Add foreign key relationship between inspections and projects
ALTER TABLE public.inspections
ADD CONSTRAINT inspections_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON public.inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date_desc ON public.inspections(inspection_date DESC);