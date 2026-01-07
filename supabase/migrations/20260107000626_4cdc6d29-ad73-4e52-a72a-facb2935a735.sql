-- Drop the foreign key constraint that requires user_id to exist in auth.users
ALTER TABLE daily_reports 
DROP CONSTRAINT IF EXISTS daily_reports_user_id_fkey;

-- Make user_id nullable so reports can be saved without authentication
ALTER TABLE daily_reports 
ALTER COLUMN user_id DROP NOT NULL;