-- SQL Migration: Configuração do Bucket de Avatares
-- Execute este comando no SQL Editor do Supabase

DO $$ 
BEGIN
  -- Cria o bucket se não existir
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Limpar políticas antigas para evitar erros de "já existe"
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Users Upload Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users Update Own Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users Delete Own Avatars" ON storage.objects;
END $$;

-- Permitir leitura pública para que qualquer um possa ver as fotos
CREATE POLICY "Public Access Avatars" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated Users Upload Avatars" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Permitir que os usuários atualizem suas fotos
CREATE POLICY "Users Update Own Avatars" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

-- Permitir deleção
CREATE POLICY "Users Delete Own Avatars" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'avatars');
