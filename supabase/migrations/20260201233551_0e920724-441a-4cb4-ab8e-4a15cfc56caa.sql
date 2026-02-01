-- Add 'attendance' module to all existing user_permissions that don't have it
UPDATE public.user_permissions
SET modules = array_append(modules, 'attendance'),
    updated_at = now()
WHERE NOT ('attendance' = ANY(modules));