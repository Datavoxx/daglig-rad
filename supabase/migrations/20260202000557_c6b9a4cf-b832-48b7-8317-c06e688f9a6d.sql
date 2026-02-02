-- Drop existing SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy that allows viewing own profile OR employee profiles
CREATE POLICY "Users can view own profile or employee profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.linked_user_id = profiles.id 
        AND e.user_id = auth.uid()
        AND e.is_active = true
    )
  );