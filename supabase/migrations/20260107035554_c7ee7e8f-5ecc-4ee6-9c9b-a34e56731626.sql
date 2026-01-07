-- Create project_plans table for storing project planning data
CREATE TABLE public.project_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID,
  original_transcript TEXT,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_weeks INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_plans ENABLE ROW LEVEL SECURITY;

-- RLS policy (same pattern as other tables)
CREATE POLICY "Allow all access to project_plans"
  ON public.project_plans FOR ALL
  USING (true) WITH CHECK (true);

-- Unique constraint: one plan per project in v1
CREATE UNIQUE INDEX project_plans_project_id_unique ON public.project_plans(project_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_plans_updated_at
  BEFORE UPDATE ON public.project_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();