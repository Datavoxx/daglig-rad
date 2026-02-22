
-- salary_types: Fortnox-kolumner
ALTER TABLE salary_types ADD COLUMN fortnox_wage_code text;
ALTER TABLE salary_types ADD COLUMN fortnox_salary_type text;

-- payroll_exports: provider-tracking
ALTER TABLE payroll_exports ADD COLUMN provider text DEFAULT 'visma';
ALTER TABLE payroll_exports ADD COLUMN export_format text;

-- company_settings: lonesystem-val
ALTER TABLE company_settings ADD COLUMN payroll_provider text;

-- employees: Fortnox-specifikt ID
ALTER TABLE employees ADD COLUMN fortnox_employee_id text;
