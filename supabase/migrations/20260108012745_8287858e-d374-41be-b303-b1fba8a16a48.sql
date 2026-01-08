-- Create user pricing settings table
CREATE TABLE public.user_pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hourly rates for different trades
  hourly_rate_carpenter NUMERIC DEFAULT 520,
  hourly_rate_painter NUMERIC DEFAULT 480,
  hourly_rate_tiler NUMERIC DEFAULT 520,
  hourly_rate_general NUMERIC DEFAULT 500,
  
  -- Markups
  material_markup_percent NUMERIC DEFAULT 10,
  default_estimate_markup NUMERIC DEFAULT 15,
  
  -- VAT
  vat_percent NUMERIC DEFAULT 25,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own pricing settings"
ON public.user_pricing_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pricing settings"
ON public.user_pricing_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pricing settings"
ON public.user_pricing_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_pricing_settings_updated_at
BEFORE UPDATE ON public.user_pricing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();