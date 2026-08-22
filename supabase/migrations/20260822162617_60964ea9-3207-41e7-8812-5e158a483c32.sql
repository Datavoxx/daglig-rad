CREATE OR REPLACE VIEW public.user_permissions_with_email AS
SELECT
  up.id,
  up.user_id,
  p.email,
  p.full_name,
  up.modules,
  up.created_at,
  up.updated_at
FROM public.user_permissions up
LEFT JOIN public.profiles p ON p.id = up.user_id;

GRANT SELECT ON public.user_permissions_with_email TO authenticated;
GRANT SELECT ON public.user_permissions_with_email TO service_role;