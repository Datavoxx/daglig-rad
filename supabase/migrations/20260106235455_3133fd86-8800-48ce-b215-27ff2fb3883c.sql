-- Add ÄTA (Ändrings- och Tilläggsarbeten) column to daily_reports
ALTER TABLE public.daily_reports ADD COLUMN ata JSONB DEFAULT NULL;