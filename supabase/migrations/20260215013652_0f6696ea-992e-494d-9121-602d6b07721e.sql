
-- Add 'founder' to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'founder';

-- Update handle_new_user() to set default role to 'admin' instead of 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default role as 'admin' (all self-registered users are admins/managers)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
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
$function$;
