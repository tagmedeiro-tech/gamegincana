-- SQL Migration: Correção de Contagem de Membros (memberCount)
-- Executar no SQL Editor do Supabase

-- 1. Cria a função que atualiza a contagem automaticamente
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o guerreiro saiu de uma tribo
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD."groupId" IS DISTINCT FROM NEW."groupId") THEN
    IF OLD."groupId" IS NOT NULL THEN
      UPDATE public.groups SET "memberCount" = GREATEST("memberCount" - 1, 0) WHERE id = OLD."groupId";
    END IF;
  END IF;

  -- Se o guerreiro entrou em uma tribo nova
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD."groupId" IS DISTINCT FROM NEW."groupId") THEN
    IF NEW."groupId" IS NOT NULL THEN
      UPDATE public.groups SET "memberCount" = "memberCount" + 1 WHERE id = NEW."groupId";
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ativa o gatilho na tabela profiles
DROP TRIGGER IF EXISTS maintain_group_member_count ON public.profiles;
CREATE TRIGGER maintain_group_member_count
AFTER INSERT OR UPDATE OF "groupId" OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- 3. Recalcula e corrige a base atual para não ter erros no placar
UPDATE public.groups g
SET "memberCount" = (
  SELECT count(*) FROM public.profiles p WHERE p."groupId" = g.id
);
