-- Fix existing employee permissions: set them to only attendance, time-reporting, daily-reports
UPDATE public.user_permissions
SET modules = ARRAY['attendance', 'time-reporting', 'daily-reports']::text[],
    updated_at = now()
WHERE user_id IN (
  SELECT linked_user_id 
  FROM public.employees 
  WHERE linked_user_id IS NOT NULL 
    AND is_active = true
);