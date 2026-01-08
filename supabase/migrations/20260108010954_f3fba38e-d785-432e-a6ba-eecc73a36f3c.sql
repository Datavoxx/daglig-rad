-- Create project_estimates table
CREATE TABLE public.project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  
  scope TEXT,
  assumptions JSONB DEFAULT '[]'::jsonb,
  uncertainties JSONB DEFAULT '[]'::jsonb,
  
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  subcontractor_cost NUMERIC DEFAULT 0,
  markup_percent NUMERIC DEFAULT 15,
  total_excl_vat NUMERIC DEFAULT 0,
  total_incl_vat NUMERIC DEFAULT 0,
  
  original_transcript TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create estimate_items table
CREATE TABLE public.estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  moment TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  hours NUMERIC,
  unit_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  comment TEXT,
  uncertainty TEXT DEFAULT 'medium',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create estimate_share_links table
CREATE TABLE public.estimate_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.project_estimates(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_share_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_estimates
CREATE POLICY "Allow all access to project_estimates" 
ON public.project_estimates 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- RLS policies for estimate_items
CREATE POLICY "Allow all access to estimate_items" 
ON public.estimate_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- RLS policies for estimate_share_links
CREATE POLICY "Allow all access to estimate_share_links" 
ON public.estimate_share_links 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX idx_estimate_items_estimate_id ON public.estimate_items(estimate_id);
CREATE INDEX idx_estimate_share_links_token ON public.estimate_share_links(token);

-- Add updated_at triggers
CREATE TRIGGER update_project_estimates_updated_at
BEFORE UPDATE ON public.project_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estimate_items_updated_at
BEFORE UPDATE ON public.estimate_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();