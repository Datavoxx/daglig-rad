ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS email text;

UPDATE public.user_permissions up
SET email = p.email
FROM public.profiles p
WHERE p.id = up.user_id;

CREATE OR REPLACE FUNCTION public.sync_user_permissions_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT email INTO NEW.email FROM public.profiles WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_permissions_email_insert ON public.user_permissions;
CREATE TRIGGER sync_user_permissions_email_insert
BEFORE INSERT ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION public.sync_user_permissions_email();

CREATE OR REPLACE FUNCTION public.sync_permissions_email_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.email IS DISTINCT FROM OLD.email) THEN
    UPDATE public.user_permissions SET email = NEW.email WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_permissions_email_from_profiles ON public.profiles;
CREATE TRIGGER sync_permissions_email_from_profiles
AFTER UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_permissions_email_from_profiles();