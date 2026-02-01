-- Funktion: Hämta arbetsgivarens user_id för en anställd
CREATE OR REPLACE FUNCTION public.get_employer_id(employee_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.user_id 
  FROM public.employees e 
  WHERE e.linked_user_id = employee_user_id 
    AND e.is_active = true
  LIMIT 1
$$;

-- Ta bort gamla policies på projects som begränsar till endast user_id
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

-- Ny RLS-policy: Ägare och anställda kan se projekt
CREATE POLICY "Users and employees can view projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );

-- Ny RLS-policy: Ägare och anställda kan skapa projekt
CREATE POLICY "Users and employees can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );

-- Ny RLS-policy: Ägare och anställda kan uppdatera projekt
CREATE POLICY "Users and employees can update projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );

-- Ny RLS-policy: Ägare och anställda kan radera projekt
CREATE POLICY "Users and employees can delete projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() = user_id 
    OR user_id = public.get_employer_id(auth.uid())
  );