-- ============================================================
-- FIX CRÍTICO: Políticas RLS para Admin na tabela profiles
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Permitir que ADMINS atualizem qualquer perfil (role, status, groupId, etc.)
DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
CREATE POLICY "Admins can update any profile."
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 2. Permitir que ADMINS deletem qualquer perfil
DROP POLICY IF EXISTS "Admins can delete any profile." ON profiles;
CREATE POLICY "Admins can delete any profile."
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 3. Permitir que ADMINS insiram perfis (para sync de usuários órfãos)
DROP POLICY IF EXISTS "Admins can insert profiles." ON profiles;
CREATE POLICY "Admins can insert profiles."
ON profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 4. Função de banimento no Auth (alternativa segura à deleção)
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

-- 5. Permitir que ADMINS deletem mensagens do chat (LIMPAR MURAL)
DROP POLICY IF EXISTS "Admins can delete messages." ON messages;
CREATE POLICY "Admins can delete messages."
ON messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 6. Permitir que o autor ou Admin editem mensagens
DROP POLICY IF EXISTS "Authors and admins can update messages." ON messages;
CREATE POLICY "Authors and admins can update messages."
ON messages FOR UPDATE
USING (
  auth.uid() = "senderId"
  OR EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 7. Recarregar esquema
NOTIFY pgrst, 'reload schema';

-- DUELO: Políticas RLS para as tabelas de duelo
-- (Execute APÓS o fix_duel_system.sql ter criado a função finalize_duel)

-- Permite que participantes do duelo insiram respostas
DROP POLICY IF EXISTS "Users submit own answers" ON duel_answers;
CREATE POLICY "Users submit own answers" ON duel_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permite que qualquer usuário autenticado veja perguntas ativas
DROP POLICY IF EXISTS "Anyone can read active duel questions" ON duel_questions;
CREATE POLICY "Anyone can read active duel questions" ON duel_questions
  FOR SELECT USING (is_active = true);

NOTIFY pgrst, 'reload schema';
