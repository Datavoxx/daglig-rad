-- Skapa tabell för projektdelningslänkar
CREATE TABLE public.project_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.project_share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Alla kan läsa (för delning via token)
CREATE POLICY "Allow all access to project_share_links" 
ON public.project_share_links 
FOR ALL 
USING (true) 
WITH CHECK (true);