-- SCRIPT DE DIAGNÓSTICO E LIBERAÇÃO (RODAR NO SQL EDITOR)

-- 1. Forçar a função Admin a ser mais robusta
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  -- Verifica se o ID do usuário logado tem role = 'admin' na tabela profiles
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. MODO DEUS: Liberar leitura para QUALQUER usuário autenticado ver TODOS os perfis
-- Isso nos dirá se os dados existem ou não.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles visibility" ON profiles;

CREATE POLICY "Profiles visibility" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true); -- LIBERADO PARA TESTE (TODOS VEEM TUDO)

-- 3. Manter a trava de edição (apenas admins editam tudo)
DROP POLICY IF EXISTS "Admins update all" ON profiles;
CREATE POLICY "Admins update all" 
ON profiles FOR UPDATE 
TO authenticated 
USING ( is_admin() );

-- 4. Forçar atualização do esquema
NOTIFY pgrst, 'reload schema';

-- 5. VERIFICAÇÃO RÁPIDA: Rode este comando abaixo junto e veja o resultado no painel 'Results'
SELECT count(*) as total_perfis FROM profiles;
