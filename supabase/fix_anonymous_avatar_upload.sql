-- Adição de RLS para upload anônimo de avatares durante o cadastro

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anonymous Upload Avatars" ON storage.objects;
END $$;

CREATE POLICY "Anonymous Upload Avatars" ON storage.objects 
FOR INSERT TO anon WITH CHECK (bucket_id = 'avatars');
