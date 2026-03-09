-- Add show_nome_escola column to timbres table
ALTER TABLE public.timbres 
ADD COLUMN show_nome_escola boolean DEFAULT true;