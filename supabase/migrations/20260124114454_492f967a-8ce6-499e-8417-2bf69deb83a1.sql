-- Update handle_new_user function to assign default permissions for new users
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
    
    -- Assign default role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Assign default permissions (only 4 modules: projects, estimates, customers, settings)
    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY['projects', 'estimates', 'customers', 'settings']);
    
    RETURN NEW;
END;
$$;