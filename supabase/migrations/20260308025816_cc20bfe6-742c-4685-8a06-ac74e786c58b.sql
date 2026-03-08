
-- Create storage bucket for scanned answer sheets
INSERT INTO storage.buckets (id, name, public) VALUES ('gabaritos', 'gabaritos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload gabaritos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gabaritos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can read their own gabaritos
CREATE POLICY "Users can read own gabaritos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'gabaritos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add imagem_gabarito_url to respostas_alunos
ALTER TABLE public.respostas_alunos ADD COLUMN IF NOT EXISTS imagem_gabarito_url text;
