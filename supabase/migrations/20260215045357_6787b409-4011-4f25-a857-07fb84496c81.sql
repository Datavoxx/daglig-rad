
-- Add name column to user_roles
ALTER TABLE public.user_roles ADD COLUMN name TEXT;

-- Populate name from profiles
UPDATE public.user_roles ur
SET name = p.full_name
FROM public.profiles p
WHERE ur.user_id = p.id;

-- Set all users to admin EXCEPT linked workers
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id NOT IN (
  SELECT linked_user_id FROM public.employees WHERE linked_user_id IS NOT NULL
);

-- Update handle_new_user() to include name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default role as 'admin' with name
    INSERT INTO public.user_roles (user_id, role, name)
    VALUES (NEW.id, 'admin', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    -- Assign ALL modules (full access for admin users)
    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY[
      'dashboard',
      'projects', 
      'estimates', 
      'customers', 
      'guide',
      'settings', 
      'invoices',
      'time-reporting',
      'attendance',
      'daily-reports',
      'payroll-export'
    ]);
    
    RETURN NEW;
END;
$$;
