-- Add new columns for enhanced estimate functionality
-- Note: introduction_text, closing_text, offer_number, valid_days already exist in the schema
-- We just need to ensure they're properly used

-- Create function to auto-generate offer number if not exists
CREATE OR REPLACE FUNCTION public.generate_offer_number()
RETURNS TRIGGER AS $$
DECLARE
  year_count INTEGER;
BEGIN
  IF NEW.offer_number IS NULL OR NEW.offer_number = '' THEN
    SELECT COUNT(*) + 1 INTO year_count 
    FROM project_estimates 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    NEW.offer_number := 'OFF-' || 
      EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
      LPAD(year_count::TEXT, 4, '0');
  END IF;
  
  IF NEW.valid_days IS NULL THEN
    NEW.valid_days := 30;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating offer number
DROP TRIGGER IF EXISTS set_offer_number ON project_estimates;
CREATE TRIGGER set_offer_number
BEFORE INSERT ON project_estimates
FOR EACH ROW EXECUTE FUNCTION public.generate_offer_number();