
-- Create table for personal library of saved documents (plans and activities)
CREATE TABLE public.documentos_salvos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'plano', -- 'plano' or 'atividade'
  titulo TEXT NOT NULL DEFAULT 'Sem título',
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  modelo TEXT, -- for plans: 'simples', 'tradicional', 'criativo'
  disciplina TEXT,
  nivel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_salvos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON public.documentos_salvos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.documentos_salvos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.documentos_salvos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.documentos_salvos FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_documentos_salvos_updated_at
BEFORE UPDATE ON public.documentos_salvos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
