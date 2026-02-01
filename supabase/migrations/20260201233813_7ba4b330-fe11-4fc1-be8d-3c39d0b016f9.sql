-- Tabell för QR-tokens
CREATE TABLE public.attendance_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Lägg till guest_name i attendance_records för gäster
ALTER TABLE public.attendance_records 
ADD COLUMN guest_name text;

-- RLS för attendance_qr_tokens
ALTER TABLE public.attendance_qr_tokens ENABLE ROW LEVEL SECURITY;

-- Ägare kan hantera sina tokens
CREATE POLICY "Users can manage own tokens"
  ON public.attendance_qr_tokens FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Alla kan läsa tokens (för validering vid scan)
CREATE POLICY "Anyone can read tokens for validation"
  ON public.attendance_qr_tokens FOR SELECT
  USING (true);

-- Index för snabb token-lookup
CREATE INDEX idx_attendance_qr_tokens_token ON public.attendance_qr_tokens(token);
CREATE INDEX idx_attendance_qr_tokens_project ON public.attendance_qr_tokens(project_id);