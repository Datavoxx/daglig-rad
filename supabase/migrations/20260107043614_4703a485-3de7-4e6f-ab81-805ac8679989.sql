-- Create table for plan share links
CREATE TABLE public.plan_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.plan_share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all access for sharing functionality
CREATE POLICY "Allow all access to plan_share_links" 
ON public.plan_share_links 
FOR ALL 
USING (true) 
WITH CHECK (true);