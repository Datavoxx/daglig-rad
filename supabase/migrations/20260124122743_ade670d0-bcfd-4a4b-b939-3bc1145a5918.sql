-- =============================================
-- FIX RLS POLICIES FOR USER DATA ISOLATION
-- =============================================

-- 1. project_estimates - Replace "Allow all" with user-based policies
DROP POLICY IF EXISTS "Allow all access to project_estimates" ON project_estimates;

CREATE POLICY "Users can view own estimates" 
ON project_estimates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own estimates" 
ON project_estimates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates" 
ON project_estimates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates" 
ON project_estimates FOR DELETE 
USING (auth.uid() = user_id);

-- 2. daily_reports - Replace "Allow all" with user-based policies
DROP POLICY IF EXISTS "Allow all access to daily_reports" ON daily_reports;

CREATE POLICY "Users can view own reports" 
ON daily_reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" 
ON daily_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" 
ON daily_reports FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" 
ON daily_reports FOR DELETE 
USING (auth.uid() = user_id);

-- 3. inspections - Replace "Allow all" with user-based policies
DROP POLICY IF EXISTS "Allow all access to inspections" ON inspections;

CREATE POLICY "Users can view own inspections" 
ON inspections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspections" 
ON inspections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections" 
ON inspections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspections" 
ON inspections FOR DELETE 
USING (auth.uid() = user_id);

-- 4. project_plans - Replace "Allow all" with user-based policies
DROP POLICY IF EXISTS "Allow all access to project_plans" ON project_plans;

CREATE POLICY "Users can view own plans" 
ON project_plans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" 
ON project_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" 
ON project_plans FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" 
ON project_plans FOR DELETE 
USING (auth.uid() = user_id);

-- 5. estimate_items - Need to check via estimate ownership
DROP POLICY IF EXISTS "Allow all access to estimate_items" ON estimate_items;

CREATE POLICY "Users can manage own estimate items" 
ON estimate_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_estimates 
    WHERE project_estimates.id = estimate_items.estimate_id 
    AND project_estimates.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_estimates 
    WHERE project_estimates.id = estimate_items.estimate_id 
    AND project_estimates.user_id = auth.uid()
  )
);

-- 6. estimate_addons - Need to check via estimate ownership
DROP POLICY IF EXISTS "Allow all access to estimate_addons" ON estimate_addons;

CREATE POLICY "Users can manage own estimate addons" 
ON estimate_addons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_estimates 
    WHERE project_estimates.id = estimate_addons.estimate_id 
    AND project_estimates.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_estimates 
    WHERE project_estimates.id = estimate_addons.estimate_id 
    AND project_estimates.user_id = auth.uid()
  )
);