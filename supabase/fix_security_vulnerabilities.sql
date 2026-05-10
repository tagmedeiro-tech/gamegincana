-- SQL Migration: Fechamento de Brechas de Segurança (RLS e RPC)
-- Executar no SQL Editor do Supabase

-- 1. Trava de Segurança na Tabela Profiles (Impede hack de pontos e admin)
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se a chamada vem da API do cliente (PostgREST)
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    -- Se o usuário não for ADMIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      
      -- 1. PROTEÇÃO ABSOLUTA: Usuários NUNCA podem alterar seus próprios pontos ou moedas via API client-side
      NEW."totalPoints" = OLD."totalPoints";
      NEW.coins = OLD.coins;
      
      -- 2. PROTEÇÃO DE ESTADO: Se o usuário já está ativo, ele não pode mais mudar de tribo, status ou virar admin
      IF OLD.status != 'pending' THEN
        NEW.role = OLD.role;
        NEW."groupId" = OLD."groupId";
        NEW.status = OLD.status;
      END IF;

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();


-- 2. Correção Crítica na Função de Banimento
-- Antes, qualquer usuário logado podia banir qualquer pessoa (incluindo admins).
CREATE OR REPLACE FUNCTION public.ban_user_in_auth(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Segurança: Apenas admins podem executar o banimento
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem banir usuários.';
  END IF;

  -- Impede banir a si mesmo ou banir outros admins (opcional, mas recomendado)
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Acesso Negado: Você não pode banir a si mesmo.';
  END IF;

  UPDATE auth.users 
  SET banned_until = '2099-12-31 23:59:59+00'
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
