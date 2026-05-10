// Script para corrigir RLS do Supabase usando conexão direta PostgreSQL
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:triboide001@db.fwdtsfczcdzqbmroxaxc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- ============================================================
-- FIX RLS: Policies corretas para a tabela profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas (nomes variados que possam existir)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.profiles';
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Policy 1: Qualquer autenticado vê todos os perfis (essencial para ranking/feed)
CREATE POLICY "authenticated_read_all_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Usuario insere o proprio perfil no cadastro
CREATE POLICY "user_insert_own_profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Usuario atualiza o proprio perfil
CREATE POLICY "user_update_own_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policy 4: Admin tem acesso total
CREATE POLICY "admin_full_access"
ON public.profiles FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
);

-- ============================================================
-- FIX RLS: point_logs (garantir leitura por autenticados)
-- ============================================================
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'point_logs' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.point_logs';
  END LOOP;
END $$;

CREATE POLICY "authenticated_read_point_logs"
ON public.point_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_point_logs"
ON public.point_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_manage_point_logs"
ON public.point_logs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('profiles', 'point_logs')
ORDER BY tablename, policyname;
`;

async function run() {
  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('Conectado! Executando SQL...\n');
    
    const result = await client.query(sql);
    
    // O último SELECT retorna as policies
    const lastResult = Array.isArray(result) ? result[result.length - 1] : result;
    if (lastResult?.rows) {
      console.log('\n✅ POLICIES ATIVAS APÓS CORREÇÃO:');
      console.table(lastResult.rows);
    }
    
    console.log('\n✅ RLS corrigido com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

run();
