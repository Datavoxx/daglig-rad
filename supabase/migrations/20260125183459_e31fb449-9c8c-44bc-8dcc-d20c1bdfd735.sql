-- Add offertpost-style columns to project_ata for structured line items
ALTER TABLE project_ata 
ADD COLUMN IF NOT EXISTS article text,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'st',
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rot_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_only_total boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Delete test report from January 6th if it exists
DELETE FROM daily_reports WHERE id = 'ecd31358-aa6a-4f57-883b-e3b095bd0a47';