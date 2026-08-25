CREATE POLICY "Users manage own doc images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'doc-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'doc-images' AND auth.uid()::text = (storage.foldername(name))[1]);