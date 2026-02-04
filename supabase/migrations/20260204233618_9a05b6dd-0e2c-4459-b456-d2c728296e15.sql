-- Fas 1: Uppdatera employees med Visma-identifierare
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_number text,
ADD COLUMN IF NOT EXISTS personal_number text;

-- Fas 1.2: Uppdatera salary_types med Visma-mappning
ALTER TABLE salary_types
ADD COLUMN IF NOT EXISTS visma_wage_code text,
ADD COLUMN IF NOT EXISTS visma_salary_type text,
ADD COLUMN IF NOT EXISTS time_type text DEFAULT 'WORK';

-- Fas 1.3: Uppdatera time_entries med attestering och exportstatus
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS status text DEFAULT 'skapad',
ADD COLUMN IF NOT EXISTS attested_by uuid,
ADD COLUMN IF NOT EXISTS attested_at timestamptz,
ADD COLUMN IF NOT EXISTS export_id uuid;

-- Fas 1.4: Skapa payroll_periods för periodlåsning
CREATE TABLE IF NOT EXISTS payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'open',
  locked_at timestamptz,
  locked_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

-- Enable RLS on payroll_periods
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_periods
CREATE POLICY "Users can view own periods" ON payroll_periods
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own periods" ON payroll_periods
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own periods" ON payroll_periods
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own periods" ON payroll_periods
FOR DELETE USING (auth.uid() = user_id);

-- Fas 1.5: Skapa payroll_exports för exporthistorik
CREATE TABLE IF NOT EXISTS payroll_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_id uuid REFERENCES payroll_periods(id),
  exported_at timestamptz DEFAULT now(),
  file_name text,
  pdf_url text,
  entry_count integer DEFAULT 0,
  total_hours numeric DEFAULT 0,
  employee_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on payroll_exports
ALTER TABLE payroll_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_exports
CREATE POLICY "Users can view own exports" ON payroll_exports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports" ON payroll_exports
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add FK constraint on time_entries.export_id
ALTER TABLE time_entries
ADD CONSTRAINT time_entries_export_id_fkey 
FOREIGN KEY (export_id) REFERENCES payroll_exports(id) ON DELETE SET NULL;

-- Update trigger for payroll_periods
CREATE TRIGGER update_payroll_periods_updated_at
BEFORE UPDATE ON payroll_periods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();