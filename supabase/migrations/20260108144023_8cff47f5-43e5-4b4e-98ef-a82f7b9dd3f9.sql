-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);