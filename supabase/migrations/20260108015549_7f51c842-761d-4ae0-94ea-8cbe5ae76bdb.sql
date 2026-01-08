-- Create project-specific pricing settings table
CREATE TABLE public.project_pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Hourly rates
  hourly_rate_carpenter NUMERIC DEFAULT 500,
  hourly_rate_painter NUMERIC DEFAULT 450,
  hourly_rate_tiler NUMERIC DEFAULT 520,
  hourly_rate_general NUMERIC DEFAULT 480,
  
  -- Markups
  material_markup_percent NUMERIC DEFAULT 10,
  default_estimate_markup NUMERIC DEFAULT 15,
  
  -- VAT
  vat_percent NUMERIC DEFAULT 25,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_pricing_settings ENABLE ROW LEVEL SECURITY;

-- Allow all access (matching existing pattern)
CREATE POLICY "Allow all access to project_pricing_settings"
  ON public.project_pricing_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);