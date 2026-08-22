CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_by uuid NOT NULL,
  updated_by uuid,
  title text NOT NULL DEFAULT 'Namnlöst dokument',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  plain_text text DEFAULT '',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can view documents" ON public.documents FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid()));

CREATE POLICY "Company can create documents" ON public.documents FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid())) AND created_by = auth.uid());

CREATE POLICY "Company can update documents" ON public.documents FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid()))
WITH CHECK (user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid()));

CREATE POLICY "Company can delete documents" ON public.documents FOR DELETE TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_employer_id(auth.uid()));

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX documents_user_id_idx ON public.documents(user_id);
CREATE INDEX documents_project_id_idx ON public.documents(project_id);