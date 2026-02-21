
-- Create receipts table
CREATE TABLE public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_name text,
  org_number text,
  receipt_number text,
  receipt_date date,
  payment_method text,
  project_id uuid REFERENCES public.projects(id),
  items jsonb DEFAULT '[]'::jsonb,
  vat_breakdown jsonb DEFAULT '[]'::jsonb,
  total_ex_vat numeric DEFAULT 0,
  total_vat numeric DEFAULT 0,
  total_inc_vat numeric DEFAULT 0,
  image_storage_path text,
  original_file_name text,
  ai_extracted boolean DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as vendor_invoices)
CREATE POLICY "Users can view own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON public.receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
