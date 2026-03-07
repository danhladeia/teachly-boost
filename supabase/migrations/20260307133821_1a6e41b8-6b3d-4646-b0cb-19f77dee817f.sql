
-- 1. Table: provas
CREATE TABLE public.provas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL DEFAULT 'Prova sem título',
  temas text,
  nivel text,
  serie text,
  tipo_questoes text DEFAULT 'mista',
  escola text,
  professor text,
  turma text,
  config_tempo integer,
  tipo_tempo text DEFAULT 'total',
  status text DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provas" ON public.provas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own provas" ON public.provas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own provas" ON public.provas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own provas" ON public.provas FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_provas_updated_at BEFORE UPDATE ON public.provas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Security definer function (now provas exists)
CREATE OR REPLACE FUNCTION public.is_prova_owner(p_prova_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.provas
    WHERE id = p_prova_id AND user_id = auth.uid()
  );
$$;

-- 3. Table: questoes
CREATE TABLE public.questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prova_id uuid NOT NULL REFERENCES public.provas(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'mc',
  conteudo text NOT NULL DEFAULT '',
  alternativas jsonb,
  resposta_correta integer,
  linhas integer DEFAULT 4,
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questoes" ON public.questoes FOR SELECT TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can insert own questoes" ON public.questoes FOR INSERT TO authenticated WITH CHECK (public.is_prova_owner(prova_id));
CREATE POLICY "Users can update own questoes" ON public.questoes FOR UPDATE TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can delete own questoes" ON public.questoes FOR DELETE TO authenticated USING (public.is_prova_owner(prova_id));

-- 4. Table: versoes_prova
CREATE TABLE public.versoes_prova (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prova_id uuid NOT NULL REFERENCES public.provas(id) ON DELETE CASCADE,
  versao_label text NOT NULL DEFAULT 'A',
  mapa_questoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  qr_code_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.versoes_prova ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own versoes" ON public.versoes_prova FOR SELECT TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can insert own versoes" ON public.versoes_prova FOR INSERT TO authenticated WITH CHECK (public.is_prova_owner(prova_id));
CREATE POLICY "Users can update own versoes" ON public.versoes_prova FOR UPDATE TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can delete own versoes" ON public.versoes_prova FOR DELETE TO authenticated USING (public.is_prova_owner(prova_id));

-- Public read for QR scanner (anon needs to fetch gabarito by qr_code_id)
CREATE POLICY "Public can read versoes by qr_code_id" ON public.versoes_prova FOR SELECT TO anon USING (true);

-- 5. Table: respostas_alunos
CREATE TABLE public.respostas_alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prova_id uuid NOT NULL REFERENCES public.provas(id) ON DELETE CASCADE,
  versao_id uuid REFERENCES public.versoes_prova(id) ON DELETE SET NULL,
  nome_aluno text NOT NULL,
  nota numeric,
  respostas_json jsonb DEFAULT '[]'::jsonb,
  tempo_gasto integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.respostas_alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own respostas" ON public.respostas_alunos FOR SELECT TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can insert respostas" ON public.respostas_alunos FOR INSERT TO authenticated WITH CHECK (public.is_prova_owner(prova_id));
CREATE POLICY "Users can update own respostas" ON public.respostas_alunos FOR UPDATE TO authenticated USING (public.is_prova_owner(prova_id));
CREATE POLICY "Users can delete own respostas" ON public.respostas_alunos FOR DELETE TO authenticated USING (public.is_prova_owner(prova_id));
