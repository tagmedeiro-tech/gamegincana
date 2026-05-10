-- =============================================
-- FIX RLS: Policies para tabela profiles
-- =============================================

-- 1. Habilitar RLS (provavelmente já está, mas garante)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas que possam estar conflitando
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 3. Criar políticas corretas

-- Qualquer usuário autenticado pode VER todos os perfis (necessário para ranking, feed, etc.)
CREATE POLICY "profiles_select_all_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Usuário pode inserir o PRÓPRIO perfil (necessário no cadastro)
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Usuário pode atualizar o PRÓPRIO perfil
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin pode fazer TUDO
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================
-- FIX RLS: Policies para tabela point_logs
-- =============================================
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_logs_select_all" ON public.point_logs;
DROP POLICY IF EXISTS "point_logs_insert_own" ON public.point_logs;

CREATE POLICY "point_logs_select_all_authenticated"
ON public.point_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "point_logs_insert_admin"
ON public.point_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
