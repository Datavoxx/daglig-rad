-- Remove user-based RLS policies and allow all access

-- daily_reports
DROP POLICY IF EXISTS "Users can create own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON daily_reports;

CREATE POLICY "Allow all access to daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);

-- projects
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;

CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- report_pdfs
DROP POLICY IF EXISTS "Users can create own pdfs" ON report_pdfs;
DROP POLICY IF EXISTS "Users can view own pdfs" ON report_pdfs;

CREATE POLICY "Allow all access to report_pdfs" ON report_pdfs FOR ALL USING (true) WITH CHECK (true);

-- share_links - keep "Anyone can view share links by token" but update others
DROP POLICY IF EXISTS "Users can create share links for own reports" ON share_links;
DROP POLICY IF EXISTS "Users can view own share links" ON share_links;

CREATE POLICY "Allow all access to share_links" ON share_links FOR ALL USING (true) WITH CHECK (true);