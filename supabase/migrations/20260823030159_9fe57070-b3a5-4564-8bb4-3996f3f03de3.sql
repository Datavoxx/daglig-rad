UPDATE public.user_permissions up
SET modules = ARRAY['dashboard','estimates','docs'], updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = up.user_id AND ur.role = 'founder'
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = up.user_id AND ur2.role = 'admin'
);