-- Create inspection_templates table for template library
CREATE TABLE public.inspection_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspections table for completed inspections
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID,
  template_id UUID REFERENCES public.inspection_templates(id),
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_name TEXT,
  inspector_company TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  signature_data TEXT,
  original_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection_files table for attachments
CREATE TABLE public.inspection_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  checkpoint_index INTEGER,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection_share_links table
CREATE TABLE public.inspection_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + '30 days'::interval),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_share_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for inspection_templates (public read)
CREATE POLICY "Anyone can view inspection templates" ON public.inspection_templates FOR SELECT USING (true);

-- RLS policies for inspections
CREATE POLICY "Allow all access to inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for inspection_files
CREATE POLICY "Allow all access to inspection_files" ON public.inspection_files FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for inspection_share_links
CREATE POLICY "Allow all access to inspection_share_links" ON public.inspection_share_links FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_inspection_templates_updated_at BEFORE UPDATE ON public.inspection_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();