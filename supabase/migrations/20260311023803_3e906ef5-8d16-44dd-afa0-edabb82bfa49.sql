-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own attachments
CREATE POLICY "Users can read own support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow support admins to read all attachments
CREATE POLICY "Admins can read all support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND public.is_support_admin(auth.uid()));