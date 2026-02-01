-- =============================================
-- FAKTUROR MODULE: Database Schema
-- =============================================

-- 1. Create customer_invoices table
CREATE TABLE public.customer_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ex_vat NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_inc_vat NUMERIC NOT NULL DEFAULT 0,
  payment_terms TEXT DEFAULT '30 dagar netto',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create vendor_invoices table
CREATE TABLE public.vendor_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'attested')),
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ex_vat NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_inc_vat NUMERIC NOT NULL DEFAULT 0,
  pdf_storage_path TEXT,
  original_file_name TEXT,
  ai_extracted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS on both tables
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for customer_invoices
CREATE POLICY "Users can view own customer invoices" 
  ON public.customer_invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own customer invoices" 
  ON public.customer_invoices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer invoices" 
  ON public.customer_invoices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer invoices" 
  ON public.customer_invoices FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. RLS Policies for vendor_invoices
CREATE POLICY "Users can view own vendor invoices" 
  ON public.vendor_invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vendor invoices" 
  ON public.vendor_invoices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor invoices" 
  ON public.vendor_invoices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor invoices" 
  ON public.vendor_invoices FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. Create storage bucket for invoice files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-files', 'invoice-files', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for invoice-files bucket
CREATE POLICY "Users can upload invoice files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own invoice files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own invoice files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Function to generate customer invoice number
CREATE OR REPLACE FUNCTION public.generate_customer_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_count INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    SELECT COUNT(*) + 1 INTO year_count 
    FROM customer_invoices 
    WHERE user_id = NEW.user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    NEW.invoice_number := 'INV-' || 
      EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
      LPAD(year_count::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Trigger for auto-generating invoice number
CREATE TRIGGER generate_customer_invoice_number_trigger
  BEFORE INSERT ON public.customer_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_customer_invoice_number();

-- 10. Updated_at triggers
CREATE TRIGGER update_customer_invoices_updated_at
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_invoices_updated_at
  BEFORE UPDATE ON public.vendor_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Update handle_new_user to replace 'economy' with 'invoices'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Assign ALL modules (full access for all users) - replaced economy with invoices
    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY[
      'dashboard',
      'projects', 
      'estimates', 
      'customers', 
      'guide',
      'settings', 
      'invoices',
      'time-reporting'
    ]);
    
    RETURN NEW;
END;
$$;

-- 12. Update existing users: replace 'economy' with 'invoices' in their permissions
UPDATE public.user_permissions 
SET modules = array_replace(modules, 'economy', 'invoices')
WHERE 'economy' = ANY(modules);