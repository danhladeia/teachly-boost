
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  mensagem TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'geral',
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notificacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notificacoes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications"
  ON public.notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_support_admin(auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can view all notifications"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (public.is_support_admin(auth.uid()));
