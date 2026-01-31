-- Skapa time_entries tabell för tidsrapportering
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employer_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  billing_type_id UUID REFERENCES public.billing_types(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Anställda kan hantera sina egna tidsrapporter
CREATE POLICY "Users can manage own time entries"
  ON public.time_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Arbetsgivare kan se sina anställdas tidsrapporter
CREATE POLICY "Employers can view employee time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = employer_id);

-- Trigger för updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();