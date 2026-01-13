-- Add new columns for quote/offer display
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS momsregnr text,
ADD COLUMN IF NOT EXISTS f_skatt boolean DEFAULT true;