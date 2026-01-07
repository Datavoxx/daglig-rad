-- Create storage bucket for inspection files
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-files', 'inspection-files', true);

-- Storage policies for inspection-files bucket
CREATE POLICY "Anyone can view inspection files" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-files');
CREATE POLICY "Anyone can upload inspection files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inspection-files');
CREATE POLICY "Anyone can update inspection files" ON storage.objects FOR UPDATE USING (bucket_id = 'inspection-files');
CREATE POLICY "Anyone can delete inspection files" ON storage.objects FOR DELETE USING (bucket_id = 'inspection-files');