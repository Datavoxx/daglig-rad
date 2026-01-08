-- Create estimate templates table
CREATE TABLE public.estimate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Hourly rates per resource
  hourly_rates JSONB DEFAULT '{}',
  
  -- Markups and percentages
  material_spill_percent NUMERIC DEFAULT 7,
  overhead_percent NUMERIC DEFAULT 12,
  risk_percent NUMERIC DEFAULT 8,
  profit_percent NUMERIC DEFAULT 10,
  vat_percent NUMERIC DEFAULT 25,
  establishment_cost NUMERIC DEFAULT 4500,
  
  -- Cost library (materials with prices)
  cost_library JSONB DEFAULT '[]',
  
  -- Work items (WBS structure)
  work_items JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own templates"
ON public.estimate_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
ON public.estimate_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.estimate_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.estimate_templates FOR DELETE
USING (auth.uid() = user_id);

-- Add template_id to project_estimates
ALTER TABLE public.project_estimates
ADD COLUMN template_id UUID REFERENCES public.estimate_templates(id);