CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, industry)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'industry'
    );

    INSERT INTO public.user_roles (user_id, role, name)
    VALUES (NEW.id, 'founder', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY['dashboard', 'estimates', 'docs']);

    RETURN NEW;
END;
$function$;

-- Only mahad@datavoxx.se keeps the admin role; all other admins become founder
UPDATE public.user_roles ur
SET role = 'founder'
WHERE ur.role = 'admin'
  AND ur.user_id <> (SELECT id FROM public.profiles WHERE email = 'mahad@datavoxx.se')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id AND ur2.role = 'founder'
  );

DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND ur.user_id <> (SELECT id FROM public.profiles WHERE email = 'mahad@datavoxx.se');