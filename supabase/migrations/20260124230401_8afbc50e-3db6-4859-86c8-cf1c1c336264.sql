-- Update the handle_new_user function to only give 3 modules by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
    -- Assign default permissions (only 3 modules: estimates, customers, settings)
    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY['estimates', 'customers', 'settings']);
    
    RETURN NEW;
END;
$$;

-- Extend projects table with new columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES public.project_estimates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning';

-- Create project_ata table for change orders
CREATE TABLE IF NOT EXISTS public.project_ata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ata_number TEXT,
  description TEXT NOT NULL,
  reason TEXT,
  estimated_hours NUMERIC,
  estimated_cost NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_ata
ALTER TABLE public.project_ata ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_ata
CREATE POLICY "Users can view own ata" ON public.project_ata
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ata" ON public.project_ata
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ata" ON public.project_ata
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ata" ON public.project_ata
FOR DELETE USING (auth.uid() = user_id);

-- Create project_work_orders table
CREATE TABLE IF NOT EXISTS public.project_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_work_orders
ALTER TABLE public.project_work_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_work_orders
CREATE POLICY "Users can view own work orders" ON public.project_work_orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work orders" ON public.project_work_orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work orders" ON public.project_work_orders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work orders" ON public.project_work_orders
FOR DELETE USING (auth.uid() = user_id);

-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'document',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_files
CREATE POLICY "Users can view own project files" ON public.project_files
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project files" ON public.project_files
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project files" ON public.project_files
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files" ON public.project_files
FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-files bucket
CREATE POLICY "Anyone can view project files" ON storage.objects
FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can upload project files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own project files" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own project files" ON storage.objects
FOR DELETE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- Add updated_at trigger for new tables
CREATE TRIGGER update_project_ata_updated_at
BEFORE UPDATE ON public.project_ata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_work_orders_updated_at
BEFORE UPDATE ON public.project_work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();