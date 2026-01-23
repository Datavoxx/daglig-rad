-- Add new columns for Bygglet-style estimate structure
ALTER TABLE estimate_items 
ADD COLUMN IF NOT EXISTS article text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS show_only_total boolean DEFAULT false;

-- Migrate existing data: copy moment to description
UPDATE estimate_items 
SET description = moment 
WHERE moment IS NOT NULL AND moment != '' AND description IS NULL;