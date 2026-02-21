
-- 1. Add columns to project_work_orders
ALTER TABLE public.project_work_orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS work_order_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS invoice_id uuid;

-- 2. work_order_time_entries
CREATE TABLE public.work_order_time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id uuid NOT NULL REFERENCES public.project_work_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 0,
  billing_type text NOT NULL DEFAULT 'service',
  description text,
  is_billable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own work order time entries"
  ON public.work_order_time_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. work_order_materials
CREATE TABLE public.work_order_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id uuid NOT NULL REFERENCES public.project_work_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  article_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'st',
  unit_price numeric NOT NULL DEFAULT 0,
  category text,
  is_billable boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own work order materials"
  ON public.work_order_materials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. work_order_notes
CREATE TABLE public.work_order_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id uuid NOT NULL REFERENCES public.project_work_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own work order notes"
  ON public.work_order_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
