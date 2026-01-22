-- Add rot_eligible column to estimate_items table
ALTER TABLE public.estimate_items 
ADD COLUMN rot_eligible BOOLEAN DEFAULT false;