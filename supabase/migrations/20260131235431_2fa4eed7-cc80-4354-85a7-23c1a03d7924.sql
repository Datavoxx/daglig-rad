-- Update existing users to include time-reporting module
UPDATE user_permissions 
SET modules = array_append(modules, 'time-reporting')
WHERE NOT ('time-reporting' = ANY(modules));

-- Update handle_new_user trigger to include time-reporting for future users
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
    
    -- Assign default role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Assign ALL modules (full access for all users) INCLUDING time-reporting
    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY[
      'dashboard',
      'projects', 
      'estimates', 
      'customers', 
      'guide',
      'settings', 
      'economy',
      'time-reporting'
    ]);
    
    RETURN NEW;
END;
$function$;