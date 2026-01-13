-- Skapa bucket för företagsloggor
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- RLS policy för att låta autentiserade användare ladda upp logga
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy för att låta autentiserade användare se sin logga
CREATE POLICY "Users can view own logo"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-logos');

-- RLS policy för att låta alla se loggor (för PDF-generering)
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'company-logos');

-- RLS policy för att låta användare ta bort sin logga
CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy för att låta användare uppdatera sin logga
CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);