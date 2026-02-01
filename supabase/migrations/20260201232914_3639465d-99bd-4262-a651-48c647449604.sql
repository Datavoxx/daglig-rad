-- Create attendance_records table for Swedish personnel register (Personalliggare)
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Users can manage their own attendance records
CREATE POLICY "Users can manage own attendance"
  ON public.attendance_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Employers can view employee attendance
CREATE POLICY "Employers can view employee attendance"
  ON public.attendance_records FOR SELECT
  USING (auth.uid() = employer_id);

-- Employers can insert attendance for employees
CREATE POLICY "Employers can insert employee attendance"
  ON public.attendance_records FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

-- Employers can update employee attendance
CREATE POLICY "Employers can update employee attendance"
  ON public.attendance_records FOR UPDATE
  USING (auth.uid() = employer_id);

-- Employers can delete employee attendance
CREATE POLICY "Employers can delete employee attendance"
  ON public.attendance_records FOR DELETE
  USING (auth.uid() = employer_id);

-- Indexes for performance
CREATE INDEX idx_attendance_project ON public.attendance_records(project_id);
CREATE INDEX idx_attendance_employer ON public.attendance_records(employer_id);
CREATE INDEX idx_attendance_user ON public.attendance_records(user_id);
CREATE INDEX idx_attendance_active ON public.attendance_records(user_id) WHERE check_out IS NULL;
CREATE INDEX idx_attendance_check_in ON public.attendance_records(check_in DESC);

-- Update handle_new_user function to include 'attendance' module
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Assign ALL modules (full access for all users) - includes attendance
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
      'attendance'
    ]);
    
    RETURN NEW;
END;
$function$;