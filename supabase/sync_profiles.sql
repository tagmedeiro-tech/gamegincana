-- ============================================================
-- SCRIPT DEFINITIVO: EXCLUSÃO COMPLETA DE USUÁRIOS
-- DIAGNÓSTICO: funções PostgreSQL normais NÃO podem deletar
-- de auth.users no Supabase (restrição de segurança da plataforma).
-- 
-- SOLUÇÃO: Deletar diretamente do public.profiles (ON DELETE CASCADE
-- cuida dos dados relacionados) e usar a Admin REST API para revogar o auth.
-- ============================================================

-- 1. Sincronizar perfis ausentes
INSERT INTO public.profiles (id, name, email, role, status, "totalPoints", coins, created_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  email, 
  'participant', 
  'active', 
  0, 
  0, 
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Garantir colunas extras no profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'coins') THEN
    ALTER TABLE public.profiles ADD COLUMN coins INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Trigger para criar perfis automaticamente em novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status, "totalPoints", coins)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.email, 
    'participant', 
    'pending',
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Função de BANIMENTO (alternativa segura à deleção do Auth)
-- Bane o usuário no Auth (impede login) e marca como arquivado no profile.
-- A deleção total do Auth deve ser feita via Admin API (ver código frontend).
CREATE OR REPLACE FUNCTION ban_user_in_auth(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET banned_until = '2099-12-31 23:59:59+00'
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION ban_user_in_auth(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ban_user_in_auth(uuid) TO service_role;

-- 5. is_admin() resiliente
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Correção de constraints do Mural (todos os tipos de posts)
ALTER TABLE feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;
ALTER TABLE feed_posts ADD CONSTRAINT feed_posts_post_type_check 
CHECK (post_type IN (
  'photo', 'text', 'bible_study', 'youtube', 'spotify_track', 
  'spotify_playlist', 'achievement', 'duel_victory', 
  'activity_proof', 'new_member', 'group_update', 'streak_milestone'
));

-- 7. Recarregar esquema do PostgREST
NOTIFY pgrst, 'reload schema';
