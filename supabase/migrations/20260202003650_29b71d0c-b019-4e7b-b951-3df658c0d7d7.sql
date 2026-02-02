-- Create articles table for article library
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  article_category text DEFAULT 'Material',
  unit text DEFAULT 'st',
  default_price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS policies for articles
CREATE POLICY "Users can view own articles"
  ON public.articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own articles"
  ON public.articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON public.articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON public.articles FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create vendor_invoices table if not exists (needed for economic overview)
CREATE TABLE IF NOT EXISTS public.vendor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  invoice_number text,
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date,
  total_ex_vat numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  total_inc_vat numeric DEFAULT 0,
  status text DEFAULT 'pending',
  notes text,
  file_url text,
  rows jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on vendor_invoices if not already
ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_invoices (drop if exists first to avoid conflicts)
DO $$ 
BEGIN
  -- Try to create policies, ignore if they already exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendor_invoices' AND policyname = 'Users can view own vendor invoices') THEN
    CREATE POLICY "Users can view own vendor invoices"
      ON public.vendor_invoices FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendor_invoices' AND policyname = 'Users can create own vendor invoices') THEN
    CREATE POLICY "Users can create own vendor invoices"
      ON public.vendor_invoices FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendor_invoices' AND policyname = 'Users can update own vendor invoices') THEN
    CREATE POLICY "Users can update own vendor invoices"
      ON public.vendor_invoices FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendor_invoices' AND policyname = 'Users can delete own vendor invoices') THEN
    CREATE POLICY "Users can delete own vendor invoices"
      ON public.vendor_invoices FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;