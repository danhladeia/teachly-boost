
CREATE TABLE public.timbres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_escola text NOT NULL DEFAULT '',
  logo_url text,
  show_professor boolean NOT NULL DEFAULT true,
  show_disciplina boolean NOT NULL DEFAULT true,
  show_serie boolean NOT NULL DEFAULT true,
  show_aluno boolean NOT NULL DEFAULT true,
  show_data boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timbres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timbres" ON public.timbres FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timbres" ON public.timbres FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timbres" ON public.timbres FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timbres" ON public.timbres FOR DELETE USING (auth.uid() = user_id);
