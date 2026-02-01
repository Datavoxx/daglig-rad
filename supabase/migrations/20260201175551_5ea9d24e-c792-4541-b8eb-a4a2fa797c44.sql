-- Tillåt arbetsgivare att skapa tidsposter för anställda
CREATE POLICY "Employers can insert time entries for employees"
  ON time_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id
  );

-- Tillåt arbetsgivare att uppdatera tidsposter för anställda  
CREATE POLICY "Employers can update employee time entries"
  ON time_entries
  FOR UPDATE
  USING (auth.uid() = employer_id);

-- Tillåt arbetsgivare att ta bort tidsposter för anställda
CREATE POLICY "Employers can delete employee time entries"
  ON time_entries
  FOR DELETE
  USING (auth.uid() = employer_id);