// Fix: Remover a policy de admin que causa recursão infinita
// A policy admin_full_access faz SELECT na própria tabela profiles = recursão!
// Solução: usar auth.uid() diretamente ou criar uma função SECURITY DEFINER

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:triboide001@db.fwdtsfczcdzqbmroxaxc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- ============================================================
-- FIX DEFINITIVO: Remover recursão infinita nas policies RLS
-- ============================================================

-- 1. Limpar TODAS as policies de profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.profiles';
    RAISE NOTICE 'Dropped: %', pol.policyname;
  END LOOP;
END $$;

-- 2. Criar função SECURITY DEFINER para verificar se um user é admin
--    Isso evita recursão pois a função roda com permissão do dono (postgres)
--    e não dispara as policies da tabela profiles
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- 3. Conceder execução da função para authenticated
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 4. Criar policies SEM recursão

-- Qualquer autenticado pode VER todos os perfis
CREATE POLICY "read_all_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Qualquer autenticado pode VER o próprio perfil (redundante mas explícito)
CREATE POLICY "read_own_profile"
ON public.profiles FOR SELECT
TO anon
USING (false); -- anon nunca vê (força login)

-- Usuário insere o próprio perfil no cadastro
CREATE POLICY "insert_own_profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Usuário atualiza o próprio perfil
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin (via função SECURITY DEFINER, SEM recursão) pode deletar/gerenciar
CREATE POLICY "admin_delete_profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admin pode atualizar qualquer perfil (inclui a policy update acima por union)
CREATE POLICY "admin_update_any_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- Verificação final
-- ============================================================
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;
`;

async function run() {
  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('Executando fix de recursão infinita...\n');
    
    const result = await client.query(sql);
    const lastResult = Array.isArray(result) ? result[result.length - 1] : result;
    
    if (lastResult?.rows) {
      console.log('\n✅ POLICIES ATIVAS:');
      console.table(lastResult.rows);
    }
    console.log('\n✅ Fix aplicado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detail:', err.detail);
  } finally {
    await client.end();
  }
}

run();
