-- Insert all existing users with full access to all modules
INSERT INTO public.user_permissions (user_id, modules)
SELECT 
  id as user_id,
  ARRAY['projects', 'reports', 'planning', 'inspections', 'estimates', 'guide', 'settings'] as modules
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;