-- Make the platform owner a founder
INSERT INTO public.user_roles (user_id, role, name)
VALUES ('8e6188ea-fb56-4425-8627-21ae7122fe97', 'founder', 'Mahad Abdullahi')
ON CONFLICT (user_id, role) DO NOTHING;

-- Founders may read and manage every permission row
CREATE POLICY "Founders can view all permissions"
ON public.user_permissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'founder'));

CREATE POLICY "Founders can update permissions"
ON public.user_permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'founder'))
WITH CHECK (public.has_role(auth.uid(), 'founder'));

CREATE POLICY "Founders can insert permissions"
ON public.user_permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'founder'));

GRANT SELECT, INSERT, UPDATE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;