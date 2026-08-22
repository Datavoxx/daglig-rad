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
    VALUES (NEW.id, 'admin', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

    INSERT INTO public.user_permissions (user_id, modules)
    VALUES (NEW.id, ARRAY[
      'dashboard',
      'projects',
      'estimates',
      'customers',
      'guide',
      'settings',
      'invoices',
      'accounting',
      'receipts',
      'time-reporting',
      'attendance',
      'daily-reports',
      'payroll-export',
      'inspections',
      'docs'
    ]);

    RETURN NEW;
END;
$function$;