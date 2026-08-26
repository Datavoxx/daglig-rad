ALTER TABLE public.project_estimates
  ADD COLUMN IF NOT EXISTS our_reference text,
  ADD COLUMN IF NOT EXISTS our_reference_phone text,
  ADD COLUMN IF NOT EXISTS payment_terms_days integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS vat_percent numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS hide_unit_price boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS round_total boolean NOT NULL DEFAULT false;