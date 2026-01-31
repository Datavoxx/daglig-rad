-- Add new columns to employees table for invitation system
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'not_invited';

-- Create employee_invitations table
CREATE TABLE IF NOT EXISTS public.employee_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  organization_name text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_invitations
CREATE POLICY "Users can view own invitations"
  ON public.employee_invitations FOR SELECT 
  USING (auth.uid() = invited_by);

CREATE POLICY "Users can insert own invitations"
  ON public.employee_invitations FOR INSERT 
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update own invitations"
  ON public.employee_invitations FOR UPDATE 
  USING (auth.uid() = invited_by);

-- Public select policy for token validation (edge functions use service role, but just in case)
CREATE POLICY "Anyone can validate tokens"
  ON public.employee_invitations FOR SELECT
  USING (true);

-- Create storage bucket for email assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for public access
CREATE POLICY "Email assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');