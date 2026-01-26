-- Create table for storing guide download leads
CREATE TABLE public.guide_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  downloaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guide_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert leads (public form)
CREATE POLICY "Anyone can submit lead"
  ON public.guide_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read leads (no SELECT policy for anon/authenticated)
CREATE POLICY "Admins can view leads"
  ON public.guide_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));