-- Create company_settings table for company information
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT,
  org_number TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  bankgiro TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own company settings" ON public.company_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company settings" ON public.company_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company settings" ON public.company_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to project_estimates for quote functionality
ALTER TABLE public.project_estimates 
  ADD COLUMN IF NOT EXISTS offer_number TEXT,
  ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rot_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rot_percent NUMERIC DEFAULT 30,
  ADD COLUMN IF NOT EXISTS valid_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '30 dagar netto';