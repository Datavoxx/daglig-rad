-- Add organization_name column to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS organization_name text;

-- Create billing_types table for managing labor roles and rates
CREATE TABLE public.billing_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  abbreviation text NOT NULL,
  hourly_rate numeric DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  billing_category text DEFAULT 'work',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on billing_types
ALTER TABLE public.billing_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_types
CREATE POLICY "Users can view own billing types"
  ON public.billing_types FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing types"
  ON public.billing_types FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing types"
  ON public.billing_types FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own billing types"
  ON public.billing_types FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at column
CREATE TRIGGER update_billing_types_updated_at
  BEFORE UPDATE ON public.billing_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();