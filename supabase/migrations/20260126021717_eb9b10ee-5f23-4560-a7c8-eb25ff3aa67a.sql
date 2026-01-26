-- First, delete duplicate rows keeping only the most recent one per user
DELETE FROM company_settings a
USING company_settings b
WHERE a.user_id = b.user_id
  AND a.updated_at < b.updated_at;

-- Add UNIQUE constraint on user_id to prevent future duplicates
ALTER TABLE company_settings 
ADD CONSTRAINT company_settings_user_id_unique UNIQUE (user_id);