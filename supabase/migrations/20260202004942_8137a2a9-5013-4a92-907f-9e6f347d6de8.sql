-- Drop existing restrictive policies on daily_reports
DROP POLICY IF EXISTS "Users can view own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON daily_reports;

-- Create new policies that include employer relationship
CREATE POLICY "Users and employees can view reports"
  ON daily_reports FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can insert reports"
  ON daily_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can update reports"
  ON daily_reports FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );

CREATE POLICY "Users and employees can delete reports"
  ON daily_reports FOR DELETE
  USING (
    auth.uid() = user_id 
    OR user_id = get_employer_id(auth.uid())
  );